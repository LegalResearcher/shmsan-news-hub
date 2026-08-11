import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Upload, X, Save, Zap, AlertCircle, RotateCcw, Pencil, Plus, ImageIcon,
} from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  slugify, uploadMediaBlob, useCurrentUser, useMyRoles, useTableRows,
} from "@/lib/admin";
import { optimizeImage, isOptimizableImage, formatFileSize } from "@/lib/imageOptimizer";
import { applyWatermark, generateWatermarkPreview } from "@/lib/imageWatermark";
import { applyHeadlineDesign, generateHeadlineDesignPreview } from "@/lib/imageHeadlineDesign";
import { generateMetaTitle, generateSEOSlug, extractSEOKeywords, SEO_SITE_URL, SEO_SITE_NAME } from "@/lib/seoHelpers";
import { getPostUrl, generateSlug as generateUrlSlug } from "@/lib/postUrl";
import { getCategoryDefaultImage, hasCategoryDefaultImage } from "@/lib/defaultImages";
import { translateError, checkSlugExists, checkTitleExists } from "@/lib/errorTranslator";
import { InternalLinkingSuggestions } from "@/components/InternalLinkingSuggestions";

export const Route = createFileRoute("/_authenticated/admin/posts/$id")({
  component: PostEditor,
});

const DRAFT_STORAGE_KEY = "shamsan_draft_new_post";

// نفس منطق التحقق (zod) بالجنوب فويس، مع تبديل category → category_id
// (لأن شمسان نيوز يربط الأقسام بجدول categories بدل تخزين الاسم كنص حر)
// وimage_url → cover_image ليطابق عمود شمسان.
const postSchema = z.object({
  title: z.string().trim().min(1, "العنوان مطلوب").max(200, "العنوان يجب أن يكون أقل من 200 حرف"),
  content: z.string().trim().min(1, "المحتوى مطلوب").max(50000, "المحتوى يجب أن يكون أقل من 50000 حرف"),
  excerpt: z.string().trim().max(500, "الملخص يجب أن يكون أقل من 500 حرف").optional().or(z.literal("")),
  cover_image: z.string().optional().or(z.literal("")),
  category_id: z.string().min(1, "القسم مطلوب"),
  is_featured: z.boolean(),
  is_opinion: z.boolean(),
  source: z.string().optional(),
  external_video_url: z.string().optional(),
  author_id: z.string().optional().nullable(),
  status: z.string(),
  scheduled_at: z.string().optional().nullable(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  slug: z.string().optional(),
});

interface FormState {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  category_id: string;
  author_id: string | null;
  status: "draft" | "published" | "scheduled";
  is_featured: boolean;
  is_opinion: boolean;
  is_pinned: boolean;
  pinned_order: string | number;
  source: string;
  badge: string;
  external_video_url: string;
  scheduled_at: string;
  seo_title: string;
  seo_description: string;
  publication_date: string; // تحكم يدوي بـ published_at
}

const seoOpeningPhrases = [
  "في تطور جديد،",
  "أفادت مصادر بأن",
  "كشفت تقارير أن",
  "أعلنت مصادر مطلعة أن",
  "وفقاً لآخر المستجدات،",
  "في خبر عاجل،",
  "أكدت مصادر موثوقة أن",
  "شهدت الساحة اليوم",
  "في سياق التطورات الأخيرة،",
  "نقلت وكالات الأنباء أن",
];
const getRandomSEOPhrase = () => seoOpeningPhrases[Math.floor(Math.random() * seoOpeningPhrases.length)];

function emptyForm(): FormState {
  return {
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    cover_image: "",
    category_id: "",
    author_id: null,
    status: "draft",
    is_featured: false,
    is_opinion: false,
    is_pinned: false,
    pinned_order: "",
    source: `${SEO_SITE_NAME} | خاص`,
    badge: "",
    external_video_url: "",
    scheduled_at: "",
    seo_title: "",
    seo_description: "",
    publication_date: "",
  };
}

function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const tzOffsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 16);
}

function calculateWordStats(content: string) {
  const words = content.trim().split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length;
  const readingTime = Math.ceil(wordCount / 200);
  return { wordCount, readingTime };
}

function formatContentParagraphs(text: string): string {
  if (!text) return text;
  return text
    .replace(/([.؟!])\s*/g, "$1\n")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .join("\n");
}

function PostEditor() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const { data: roles = [] } = useMyRoles();
  const isAdmin = roles.includes("admin");

  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingPost, setEditingPost] = useState<any>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string; type: string } | null>(null);
  const [additionalMedia, setAdditionalMedia] = useState<Array<{ name: string; url: string; type: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const additionalMediaInputRef = useRef<HTMLInputElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  const [autoSaveEnabled] = useState(true);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [showSEOPreview, setShowSEOPreview] = useState(false);
  const [preSplitContent, setPreSplitContent] = useState<{ content: string; excerpt: string } | null>(null);
  const [sentencesToSplit, setSentencesToSplit] = useState(1);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  const [enableWatermark, setEnableWatermark] = useState(false);
  const [watermarkPreview, setWatermarkPreview] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [watermarkStyle, setWatermarkStyle] = useState<"corner" | "headline">("headline");

  const { data: categories = [] } = useTableRows<{ id: string; name: string }>(
    "categories",
    "id,name",
    "sort_order",
    true,
  );
  const { data: authors = [] } = useTableRows<{ id: string; name: string }>(
    "authors",
    "id,name",
    "name",
    true,
  );
  const { data: siteSettings } = useQuery({
    queryKey: ["site-settings", "logo"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("logo_url").eq("id", 1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const logoSrc = siteSettings?.logo_url || "/favicon.ico";

  const selectedCategoryName = useMemo(
    () => categories.find((c) => c.id === form.category_id)?.name ?? null,
    [categories, form.category_id],
  );

  const { data: post } = useQuery({
    queryKey: ["admin", "post", id],
    enabled: !isNew,
    queryFn: async () => {
      const { data, error } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!post) return;
    setEditingPost(post);
    setForm({
      title: post.title ?? "",
      slug: post.slug ?? "",
      excerpt: post.excerpt ?? "",
      content: post.content ?? "",
      cover_image: post.cover_image ?? "",
      category_id: post.category_id ?? "",
      author_id: post.author_id ?? null,
      status: post.status,
      is_featured: post.is_featured ?? false,
      is_opinion: post.is_opinion ?? false,
      is_pinned: post.is_pinned ?? false,
      pinned_order: post.pinned_order ?? "",
      source: post.source ?? `${SEO_SITE_NAME} | خاص`,
      badge: post.badge ?? "",
      external_video_url: post.external_video_url ?? "",
      scheduled_at: post.scheduled_at ? toLocalInputValue(post.scheduled_at) : "",
      seo_title: post.seo_title ?? "",
      seo_description: post.seo_description ?? "",
      publication_date: post.published_at ? toLocalInputValue(post.published_at) : "",
    });

    supabase
      .from("post_media")
      .select("*")
      .eq("post_id", post.id)
      .then(({ data }) => {
        if (data) {
          setAdditionalMedia(
            data.map((m: any) => ({ name: m.file_name || "ملف", url: m.media_url, type: m.media_type })),
          );
        }
      });
  }, [post]);

  // مسودة جديدة: تحميل عبارة SEO عشوائية للمحتوى، أو استعادة مسودة محفوظة محلياً
  useEffect(() => {
    if (!isNew) return;
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (saved) return; // تُستعاد يدوياً بزر "استعادة المسودة"
    setForm((prev) => ({ ...prev, content: getRandomSEOPhrase() + " " }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew]);

  // ── فحص التكرار اللحظي للعنوان/الرابط ──
  const checkForDuplicates = useCallback(async (title: string, slug: string) => {
    if (!title && !slug) {
      setDuplicateWarning(null);
      return;
    }
    setIsCheckingDuplicate(true);
    try {
      const excludeId = editingPost?.id;
      const generatedSlug = slug || generateSEOSlug(title);
      const [titleExists, slugExists] = await Promise.all([
        title ? checkTitleExists(supabase, title, excludeId) : Promise.resolve(false),
        generatedSlug ? checkSlugExists(supabase, generatedSlug, excludeId) : Promise.resolve(false),
      ]);
      if (titleExists && slugExists) {
        setDuplicateWarning("عفواً، هذا العنوان والرابط مستخدمان بالفعل في خبر آخر");
      } else if (titleExists) {
        setDuplicateWarning("عفواً، هذا العنوان مستخدم بالفعل في خبر آخر");
      } else if (slugExists) {
        setDuplicateWarning("عفواً، هذا الرابط (Slug) مستخدم بالفعل في خبر آخر");
      } else {
        setDuplicateWarning(null);
      }
    } catch (error) {
      console.error("Duplicate check error:", error);
    } finally {
      setIsCheckingDuplicate(false);
    }
  }, [editingPost?.id]);

  useEffect(() => {
    const t = setTimeout(() => checkForDuplicates(form.title, form.slug), 500);
    return () => clearTimeout(t);
  }, [form.title, form.slug, checkForDuplicates]);

  // ── حفظ تلقائي كل 30 ثانية للمسودات ──
  const autoSaveDraft = useCallback(async () => {
    if (!autoSaveEnabled || !form.title || form.status !== "draft") return;
    try {
      const { wordCount, readingTime } = calculateWordStats(form.content);
      const tags = extractSEOKeywords(form.title, form.content);
      const draftData: any = {
        title: form.title,
        content: form.content,
        excerpt: form.excerpt || null,
        cover_image: form.cover_image || null,
        category_id: form.category_id || null,
        author_id: form.author_id || null,
        status: form.status,
        is_featured: form.is_featured,
        is_opinion: form.is_opinion,
        word_count: wordCount,
        reading_time: readingTime,
        tags,
        slug: form.slug || slugify(form.title),
        seo_title: form.seo_title || form.title,
        seo_description: form.seo_description || form.excerpt || form.content.substring(0, 160),
      };
      if (editingPost) {
        await supabase.from("posts").update(draftData).eq("id", editingPost.id);
      } else {
        const { data: newPost } = await supabase.from("posts").insert([draftData]).select().single();
        if (newPost) setEditingPost(newPost);
      }
      setLastAutoSave(new Date());
    } catch (error) {
      console.error("Auto-save error:", error);
    }
  }, [form, editingPost, autoSaveEnabled]);

  useEffect(() => {
    if (form.status !== "draft") return;
    const interval = setInterval(autoSaveDraft, 30000);
    return () => clearInterval(interval);
  }, [form.status, autoSaveDraft]);

  // ── حفظ مسودة محلياً (localStorage) للأخبار الجديدة فقط ──
  useEffect(() => {
    if (editingPost) return;
    if (form.title || form.content.length > 50 || form.excerpt) {
      localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({ ...form, uploadedFile, additionalMedia, savedAt: new Date().toISOString() }),
      );
    }
  }, [editingPost, form, uploadedFile, additionalMedia]);

  const discardDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setForm(emptyForm());
    setUploadedFile(null);
    setAdditionalMedia([]);
    toast.success("تم حذف المسودة");
  };

  // ── معاينة العلامة المائية ──
  const buildWatermarkPreview = async (imageUrl: string): Promise<string> => {
    if (watermarkStyle === "headline") {
      const headlineText = (form.title || "").trim();
      if (!headlineText) throw new Error("أدخل عنوان الخبر أولاً لتوليد شريط العنوان");
      return generateHeadlineDesignPreview(imageUrl, logoSrc, headlineText, SEO_SITE_NAME);
    }
    return generateWatermarkPreview(imageUrl, logoSrc);
  };

  const regenerateWatermarkPreview = async (imageUrl: string) => {
    if (!enableWatermark || !imageUrl) return;
    setIsGeneratingPreview(true);
    try {
      setWatermarkPreview(await buildWatermarkPreview(imageUrl));
    } catch (error) {
      console.error("Failed to regenerate watermark preview:", error);
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleWatermarkToggle = async (checked: boolean) => {
    setEnableWatermark(checked);
    if (checked && form.cover_image) {
      setIsGeneratingPreview(true);
      try {
        setWatermarkPreview(await buildWatermarkPreview(form.cover_image));
      } catch (error: any) {
        toast.error(error?.message || "فشل في إنشاء معاينة العلامة المائية");
        setEnableWatermark(false);
      } finally {
        setIsGeneratingPreview(false);
      }
    } else {
      setWatermarkPreview(null);
    }
  };

  useEffect(() => {
    if (!enableWatermark || watermarkStyle !== "headline" || !form.cover_image) return;
    const t = setTimeout(() => regenerateWatermarkPreview(form.cover_image), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.title, watermarkStyle, enableWatermark]);

  // ── رفع الصورة/الفيديو الرئيسي ──
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "video/mp4", "video/webm"];
    if (!validTypes.includes(file.type)) {
      toast.error("يرجى اختيار صورة أو فيديو صالح");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("حجم الملف يجب أن يكون أقل من 10 ميجابايت");
      return;
    }
    setUploading(true);
    try {
      let publicUrl: string;
      if (isOptimizableImage(file)) {
        toast.info(`جاري تحسين الصورة... (${formatFileSize(file.size)})`);
        const optimized = await optimizeImage(file);
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.webp`;
        publicUrl = await uploadMediaBlob(optimized.blob, fileName, "image/webp", optimized.blob.size, user?.id);
        toast.success(`تم ضغط الصورة: ${formatFileSize(optimized.originalSize)} → ${formatFileSize(optimized.optimizedSize)}`);
      } else {
        publicUrl = await uploadMediaBlob(file, file.name, file.type, file.size, user?.id);
      }
      setUploadedFile({ name: file.name, url: publicUrl, type: file.type.startsWith("video") ? "video" : "image" });
      setForm((prev) => ({ ...prev, cover_image: publicUrl }));
      if (enableWatermark && isOptimizableImage(file)) regenerateWatermarkPreview(publicUrl);
      toast.success("تم رفع الملف بنجاح");
    } catch (error: any) {
      toast.error(error.message || "فشل رفع الملف");
    } finally {
      setUploading(false);
    }
  }

  function removeUploadedFile() {
    setUploadedFile(null);
    setForm((prev) => ({ ...prev, cover_image: "" }));
    setEnableWatermark(false);
    setWatermarkPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleAdditionalMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const uploaded: Array<{ name: string; url: string; type: string }> = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "video/mp4", "video/mov", "video/webm"];
        if (!validTypes.includes(file.type)) {
          toast.error(`${file.name}: نوع الملف غير مدعوم`);
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name}: حجم الملف يجب أن يكون أقل من 10 ميجابايت`);
          continue;
        }
        try {
          const url = await uploadMediaBlob(file, file.name, file.type, file.size, user?.id);
          uploaded.push({ name: file.name, url, type: file.type.startsWith("video") ? "video" : "image" });
        } catch {
          toast.error(`${file.name}: فشل الرفع`);
        }
      }
      setAdditionalMedia((prev) => [...prev, ...uploaded]);
      toast.success(`تم رفع ${uploaded.length} ملف بنجاح`);
    } catch (error: any) {
      toast.error(error.message || "فشل رفع الملفات");
    } finally {
      setUploading(false);
      if (additionalMediaInputRef.current) additionalMediaInputRef.current.value = "";
    }
  }

  const removeAdditionalMedia = (index: number) => {
    setAdditionalMedia((prev) => prev.filter((_, i) => i !== index));
  };

  // ── الحفظ ──
  const save = useMutation({
    mutationFn: async (data: FormState) => {
      const { wordCount, readingTime } = calculateWordStats(data.content);
      const tags = extractSEOKeywords(data.title, data.content);

      let finalImageUrl = data.cover_image;
      if (enableWatermark && data.cover_image && uploadedFile?.type !== "video") {
        try {
          const usingHeadline = watermarkStyle === "headline";
          toast.info(usingHeadline ? "جاري تصميم صورة الخبر بشريط العنوان..." : "جاري إنشاء صورة المشاركة مع العلامة المائية...");
          const watermarkResult = usingHeadline
            ? await applyHeadlineDesign(data.cover_image, logoSrc, (data.title || "").trim(), SEO_SITE_NAME)
            : await applyWatermark(data.cover_image, logoSrc);
          const wmFileName = `og-${Math.random().toString(36).substring(2)}-${Date.now()}.webp`;
          finalImageUrl = await uploadMediaBlob(watermarkResult.blob, wmFileName, "image/webp", watermarkResult.blob.size, user?.id);
          toast.success(usingHeadline ? "تم تصميم صورة الخبر بنجاح" : "تم إنشاء صورة المشاركة بنجاح");
        } catch (error) {
          console.error("Watermark generation failed:", error);
          toast.error("فشل إنشاء العلامة المائية، سيتم استخدام الصورة الأصلية");
        }
      }

      if (!finalImageUrl && hasCategoryDefaultImage(selectedCategoryName)) {
        finalImageUrl = getCategoryDefaultImage(selectedCategoryName) ?? "";
      }

      const seoSlug = data.slug || generateSEOSlug(data.title);
      const seoTitle = data.seo_title || generateMetaTitle(data.title);
      const keywords = extractSEOKeywords(data.title, data.content);

      const postData: any = {
        title: data.title,
        content: data.content,
        excerpt: data.excerpt || null,
        cover_image: finalImageUrl || null,
        category_id: data.category_id || null,
        author_id: data.author_id || null,
        status: data.status,
        is_featured: data.is_featured,
        is_opinion: data.is_opinion,
        is_pinned: data.is_pinned,
        pinned_order: data.pinned_order === "" || !data.is_pinned ? null : Number(data.pinned_order),
        source: data.source || null,
        badge: data.badge || null,
        external_video_url: data.external_video_url || null,
        scheduled_at: data.status === "scheduled" && data.scheduled_at ? new Date(data.scheduled_at).toISOString() : null,
        word_count: wordCount,
        reading_time: readingTime,
        tags,
        keywords: keywords.length > 0 ? keywords : null,
        slug: seoSlug,
        seo_title: seoTitle,
        seo_description: data.seo_description || data.excerpt || data.content.substring(0, 160),
      };

      // وقت النشر (published_at): تحكم يدوي — فقط إن غيّره المستخدم فعلياً
      if (data.publication_date) {
        const originalRounded = editingPost?.published_at ? toLocalInputValue(editingPost.published_at) : null;
        if (!editingPost || data.publication_date !== originalRounded) {
          postData.published_at = new Date(data.publication_date).toISOString();
        }
      } else if (!editingPost) {
        postData.published_at = new Date().toISOString();
      }

      let postId = editingPost?.id;
      if (editingPost) {
        const { error } = await supabase.from("posts").update(postData).eq("id", editingPost.id);
        if (error) throw error;
        await supabase.from("post_media").delete().eq("post_id", editingPost.id);
      } else {
        const { data: newPost, error } = await supabase
          .from("posts")
          .insert({ ...postData, created_by: user?.id ?? null })
          .select("id")
          .single();
        if (error) throw error;
        postId = newPost.id;
      }

      if (additionalMedia.length > 0 && postId) {
        const mediaRecords = additionalMedia.map((m) => ({
          post_id: postId,
          media_url: m.url,
          media_type: m.type,
          file_name: m.name,
        }));
        const { error: mediaError } = await supabase.from("post_media").insert(mediaRecords);
        if (mediaError) throw mediaError;
      }

      return postId as string;
    },
    onSuccess: (savedId) => {
      toast.success(editingPost ? "تم تحديث الخبر بنجاح" : "تم إضافة الخبر بنجاح");
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
      if (!editingPost) localStorage.removeItem(DRAFT_STORAGE_KEY);
      if (isNew && savedId) {
        navigate({ to: "/admin/posts/$id", params: { id: savedId } });
      }
    },
    onError: (error: any) => toast.error(translateError(error)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = postSchema.safeParse(form);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }
    save.mutate(form);
  };

  const handlePublishAndIndex = async (e: React.MouseEvent) => {
    e.preventDefault();
    const result = postSchema.safeParse(form);
    if (!result.success) {
      result.error.errors.forEach((err) => toast.error(err.message));
      return;
    }
    try {
      const savedId = await save.mutateAsync(form);
      const postDate = form.publication_date ? new Date(form.publication_date) : new Date();
      const seoSlug = form.slug || generateSEOSlug(form.title);
      const postPath = getPostUrl({ id: savedId ?? "", created_at: postDate.toISOString(), slug: seoSlug, title: form.title });
      const postUrl = `${SEO_SITE_URL}${postPath}`;
      toast.info(`جاري إرسال الرابط: ${postUrl}`);

      const { data, error } = await supabase.functions.invoke("google-indexing", {
        body: { urls: [postUrl], type: "URL_UPDATED" },
      });
      if (error) {
        toast.error("تم نشر الخبر، لكن فشل الاتصال بـ Google Indexing API. تحقق من إعداد مفتاح الخدمة.");
        return;
      }
      if (data?.error) {
        toast.error(`تم نشر الخبر، لكن فشلت الفهرسة: ${data.error}`);
        return;
      }
      const indexingResult = data?.results?.[0];
      if (indexingResult?.success === true) {
        toast.success("تم نشر الخبر وإرسال طلب الفهرسة إلى Google بنجاح!");
      } else if (indexingResult?.success === false) {
        toast.error(`تم نشر الخبر، لكن فشلت الفهرسة: ${indexingResult?.data?.error?.message || indexingResult?.error || "خطأ غير معروف"}`);
      } else {
        toast.warning("تم نشر الخبر. حالة الفهرسة غير مؤكدة.");
      }
    } catch (error) {
      console.error("Publish with indexing error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-10">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="flex items-center gap-3">
          {editingPost ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          <div>
            <h1 className="truncate text-xl font-extrabold">{editingPost ? "تعديل الخبر" : "إضافة خبر جديد"}</h1>
            {lastAutoSave && form.status === "draft" && (
              <p className="text-xs text-muted-foreground">حُفظ تلقائياً: {lastAutoSave.toLocaleTimeString("ar-EG")}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!editingPost && localStorage.getItem(DRAFT_STORAGE_KEY) && (
            <Button type="button" variant="outline" size="sm" onClick={discardDraft}>
              <RotateCcw className="h-3.5 w-3.5" /> حذف المسودة
            </Button>
          )}
          <Button type="submit" disabled={save.isPending} className="shrink-0">
            <Save className="h-4 w-4" />
            {save.isPending ? "جاري الحفظ..." : editingPost ? "تحديث الخبر" : "نشر الخبر"}
          </Button>
        </div>
      </header>

      {/* ── المحتوى الأساسي ── */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-bold text-muted-foreground">المحتوى الأساسي</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="title">عنوان الخبر *</Label>
            <Input
              id="title"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || slugify(e.target.value) })}
              className={duplicateWarning ? "border-amber-500" : ""}
            />
            {duplicateWarning && (
              <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{duplicateWarning}</span>
              </div>
            )}
            {isCheckingDuplicate && <p className="text-xs text-muted-foreground">جاري التحقق...</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="source">نوع الخبر / المصدر</Label>
            <Input id="source" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="badge">وسم الخبر</Label>
            <Input id="badge" placeholder="انفراد" value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Label htmlFor="excerpt">ملخص الخبر</Label>
            <div className="flex gap-2 flex-wrap items-center">
              <Select value={sentencesToSplit.toString()} onValueChange={(v) => setSentencesToSplit(parseInt(v))}>
                <SelectTrigger className="h-7 w-16 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => (<SelectItem key={n} value={n.toString()}>{n}</SelectItem>))}
                </SelectContent>
              </Select>
              <Button type="button" variant="secondary" size="sm" className="h-7 text-xs" onClick={() => {
                const content = form.content.trim();
                if (!content) { toast.error("أدخل محتوى الخبر أولاً"); return; }
                setPreSplitContent({ content: form.content, excerpt: form.excerpt });
                const plainText = content.replace(/<[^>]*>/g, "").trim();
                const sentenceRegex = /[^.。]*[.。]/g;
                const sentences: string[] = [];
                let match;
                while ((match = sentenceRegex.exec(plainText)) !== null && sentences.length < sentencesToSplit) {
                  sentences.push(match[0].trim());
                }
                if (sentences.length > 0) {
                  const excerpt = sentences.join(" ").trim();
                  let bodyStartIndex = 0;
                  for (const s of sentences) {
                    const idx = plainText.indexOf(s, bodyStartIndex);
                    bodyStartIndex = idx + s.length;
                  }
                  const body = plainText.substring(bodyStartIndex).trim();
                  setForm({ ...form, excerpt, content: body });
                  toast.success(`تم استخراج ${sentences.length} جملة كملخص`);
                } else {
                  toast.error("لم يتم العثور على جملة كاملة تنتهي بنقطة");
                }
              }}>تقسيم تلقائي</Button>
              <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => {
                setForm((prev) => ({ ...prev, content: formatContentParagraphs(prev.content) }));
                toast.success("تم تنسيق الفقرات");
              }}>¶ تنسيق فقرات</Button>
              {preSplitContent && (
                <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => {
                  setForm({ ...form, content: preSplitContent.content, excerpt: preSplitContent.excerpt });
                  setPreSplitContent(null);
                  toast.success("تم استعادة النص الأصلي");
                }}>تراجع</Button>
              )}
              {form.excerpt && !preSplitContent && (
                <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setForm({ ...form, excerpt: "" })}>مسح الملخص</Button>
              )}
            </div>
          </div>
          <Textarea id="excerpt" rows={2} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            placeholder="اضغط 'تقسيم تلقائي' لاستخراج الجملة الأولى كملخص، أو اكتب ملخصاً مخصصاً" className="resize-none text-sm" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="content">محتوى الخبر *</Label>
          <Textarea
            id="content"
            ref={contentTextareaRef}
            required
            rows={2}
            value={form.content}
            placeholder="الصق نص الخبر هنا..."
            className="text-sm leading-relaxed resize-y min-h-[280px]"
            onPaste={(e) => {
              e.preventDefault();
              const pasted = e.clipboardData.getData("text");
              const formatted = formatContentParagraphs(pasted);
              const ta = e.currentTarget;
              const start = ta.selectionStart;
              const end = ta.selectionEnd;
              const newContent = form.content.substring(0, start) + formatted + form.content.substring(end);
              setForm((prev) => ({ ...prev, content: newContent }));
              setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + formatted.length; }, 0);
            }}
            onChange={(e) => {
              const val = e.target.value;
              const last2 = val.slice(-2);
              if (/[.؟!?]\s$/.test(last2)) setForm({ ...form, content: val.trimEnd() + "\n" });
              else setForm({ ...form, content: val });
            }}
          />
          <div className="flex items-center gap-3 text-xs text-muted-foreground bg-surface px-3 py-1.5 rounded-lg">
            <span>{calculateWordStats(form.content).wordCount} كلمة</span>
            <span>•</span>
            <span>{calculateWordStats(form.content).readingTime} دقيقة قراءة</span>
          </div>
        </div>
      </div>

      {(form.title || form.content) && (
        <InternalLinkingSuggestions
          title={form.title}
          content={form.content}
          currentPostId={editingPost?.id}
          onInsertToEditor={(htmlBlock) => {
            const textarea = contentTextareaRef.current;
            if (textarea) {
              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              const newContent = form.content.substring(0, start) + "\n\n" + htmlBlock + "\n\n" + form.content.substring(end);
              setForm({ ...form, content: newContent });
              setTimeout(() => {
                textarea.focus();
                const newPos = start + htmlBlock.length + 4;
                textarea.setSelectionRange(newPos, newPos);
              }, 100);
            } else {
              setForm({ ...form, content: form.content + "\n\n" + htmlBlock });
            }
          }}
        />
      )}

      {/* ── إعدادات النشر ── */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-bold text-muted-foreground">إعدادات النشر</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="category_id">القسم *</Label>
            <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
              <SelectTrigger id="category_id"><SelectValue placeholder="اختر القسم" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status">حالة النشر</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as FormState["status"] })}>
              <SelectTrigger id="status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="published">✅ منشور</SelectItem>
                <SelectItem value="draft">📝 مسودة</SelectItem>
                <SelectItem value="scheduled">⏰ مجدول</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="author_id">الكاتب</Label>
            <Select value={form.author_id || "none"} onValueChange={(v) => setForm({ ...form, author_id: v === "none" ? null : v })}>
              <SelectTrigger id="author_id"><SelectValue placeholder="اختر الكاتب" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— بدون كاتب</SelectItem>
                {authors.map((a) => (<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          {form.status === "scheduled" && (
            <div className="sm:col-span-3 space-y-1.5">
              <Label htmlFor="scheduled_at">موعد النشر</Label>
              <Input id="scheduled_at" type="datetime-local" required value={form.scheduled_at}
                onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
              <p className="text-xs text-muted-foreground">
                سيُنشر تلقائياً في الموعد المحدد — يتطلب جدولة استدعاء دالة publish-scheduled دورياً (cron)
              </p>
            </div>
          )}

          {isAdmin && (
            <div className="sm:col-span-3 space-y-1.5">
              <Label htmlFor="publication_date">وقت النشر (تحكم يدوي)</Label>
              <Input id="publication_date" type="datetime-local" value={form.publication_date}
                onChange={(e) => setForm({ ...form, publication_date: e.target.value })} />
              <p className="text-xs text-muted-foreground">اختياري — اتركه فارغاً لاستخدام الوقت الحالي</p>
            </div>
          )}
        </div>
      </div>

      {/* ── الوسائط ── */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-bold text-muted-foreground flex items-center gap-1.5"><ImageIcon className="h-4 w-4" /> الوسائط</h2>

        <div className="space-y-1.5">
          <Label htmlFor="cover_image">الصورة الرئيسية</Label>
          <div className="flex gap-2">
            <Input id="cover_image" placeholder="https://..." dir="ltr" className="flex-1"
              value={form.cover_image} onChange={(e) => setForm({ ...form, cover_image: e.target.value })} />
            <Button type="button" variant="outline" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-3.5 w-3.5" /> {uploading ? "جاري..." : "رفع"}
            </Button>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/mov,video/webm" onChange={handleFileUpload} className="hidden" />
          </div>
          {uploadedFile && (
            <div className="flex items-center gap-3 p-3 bg-surface rounded-lg border border-border">
              <img src={uploadedFile.url} alt="معاينة" className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{uploadedFile.name}</p>
                <p className="text-xs text-muted-foreground">تم الرفع بنجاح ✓</p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={removeUploadedFile}><X className="h-4 w-4" /></Button>
            </div>
          )}

          {!form.cover_image && hasCategoryDefaultImage(selectedCategoryName) && (
            <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
              <img src={getCategoryDefaultImage(selectedCategoryName)} alt="الصورة الافتراضية للقسم" className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-300">
                لم تُرفع صورة — سيتم استخدام الصورة الافتراضية لقسم "{selectedCategoryName}" تلقائياً عند الحفظ
              </p>
            </div>
          )}

          {form.cover_image && uploadedFile?.type !== "video" && (
            <label className="flex items-center gap-3 p-3 bg-surface border border-border rounded-lg cursor-pointer">
              <Checkbox checked={enableWatermark} disabled={isGeneratingPreview}
                onCheckedChange={(checked) => handleWatermarkToggle(checked === true)} />
              <div className="flex-1">
                <p className="text-xs font-semibold flex items-center gap-1.5"><ImageIcon className="h-3.5 w-3.5" /> إضافة علامة مائية احترافية</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {watermarkStyle === "headline" ? "شريط سفلي فيه شعار الموقع + اسمه + عنوان الخبر" : "شعار الموقع فقط بزاوية الصورة"}
                </p>
              </div>
              {isGeneratingPreview && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
            </label>
          )}
          {enableWatermark && (
            <div className="flex gap-2">
              <Button type="button" size="sm" variant={watermarkStyle === "headline" ? "default" : "outline"} className="flex-1"
                onClick={() => { setWatermarkStyle("headline"); if (form.cover_image) regenerateWatermarkPreview(form.cover_image); }}>شريط العنوان</Button>
              <Button type="button" size="sm" variant={watermarkStyle === "corner" ? "default" : "outline"} className="flex-1"
                onClick={() => { setWatermarkStyle("corner"); if (form.cover_image) regenerateWatermarkPreview(form.cover_image); }}>شعار الزاوية فقط</Button>
            </div>
          )}
          {enableWatermark && watermarkPreview && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">معاينة الصورة النهائية (1200×630):</p>
              <div className="rounded-lg overflow-hidden border border-border">
                <img src={watermarkPreview} alt="معاينة" className="w-full" style={{ aspectRatio: "1200/630" }} />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="external_video_url">رابط فيديو خارجي</Label>
          <Input id="external_video_url" dir="ltr" placeholder="https://youtube.com/watch?v=..."
            value={form.external_video_url} onChange={(e) => setForm({ ...form, external_video_url: e.target.value })} />
        </div>

        <div className="space-y-2">
          <Label>وسائط إضافية</Label>
          <button type="button" onClick={() => additionalMediaInputRef.current?.click()} disabled={uploading}
            className="flex items-center gap-2 px-4 h-10 rounded-lg border border-dashed border-border bg-background hover:bg-surface text-xs font-medium text-muted-foreground w-full justify-center">
            <Upload className="h-3.5 w-3.5" /> {uploading ? "جاري الرفع..." : "رفع صور وفيديوهات إضافية"}
          </button>
          <input ref={additionalMediaInputRef} type="file" multiple className="hidden"
            accept="image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/mov,video/webm" onChange={handleAdditionalMediaUpload} />
          {additionalMedia.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {additionalMedia.map((media, index) => (
                <div key={index} className="relative group">
                  {media.type === "video"
                    ? <video src={media.url} className="w-full h-20 object-cover rounded-lg" />
                    : <img src={media.url} alt="معاينة" className="w-full h-20 object-cover rounded-lg" />}
                  <button type="button" onClick={() => removeAdditionalMedia(index)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── SEO ── */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-muted-foreground">إعدادات SEO</h2>
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowSEOPreview(!showSEOPreview)}>
            {showSEOPreview ? "إخفاء المعاينة" : "معاينة Google"}
          </Button>
        </div>

        {showSEOPreview && (
          <div className="p-4 bg-surface rounded-lg border border-border space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-2">معاينة نتيجة البحث في Google:</p>
              <div className="bg-background p-3 rounded border border-border">
                <p className="text-blue-600 text-lg truncate">{form.seo_title || form.title || "عنوان المقال"}</p>
                <p className="text-green-700 text-sm" dir="ltr">
                  {(() => {
                    const now = form.publication_date ? new Date(form.publication_date) : new Date();
                    const y = now.getFullYear();
                    const m = String(now.getMonth() + 1).padStart(2, "0");
                    const d = String(now.getDate()).padStart(2, "0");
                    const s = form.slug || generateUrlSlug(form.title) || "slug";
                    return `${SEO_SITE_URL.replace(/^https?:\/\//, "")}/${y}/${m}/${d}/${s}`;
                  })()}
                </p>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {form.seo_description || form.excerpt || form.content.substring(0, 160) || "وصف المقال..."}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">معاينة المشاركة على فيسبوك:</p>
              <div className="bg-background rounded border border-border overflow-hidden">
                {(form.cover_image || getCategoryDefaultImage(selectedCategoryName)) && (
                  <img src={form.cover_image || getCategoryDefaultImage(selectedCategoryName)} alt="معاينة" className="w-full h-40 object-cover" />
                )}
                <div className="p-3 bg-surface">
                  <p className="text-xs text-muted-foreground uppercase">{SEO_SITE_URL.replace(/^https?:\/\//, "")}</p>
                  <p className="font-bold truncate">{form.seo_title || form.title || "عنوان المقال"}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{form.seo_description || form.excerpt || "وصف المقال..."}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="seo_title">عنوان SEO</Label>
            <span className="text-xs text-muted-foreground">{(form.seo_title || form.title || "").length}/60</span>
          </div>
          <Input id="seo_title" placeholder={form.title || "سيُؤخذ من العنوان"} value={form.seo_title}
            onChange={(e) => setForm({ ...form, seo_title: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="seo_description">وصف SEO</Label>
            <span className="text-xs text-muted-foreground">{(form.seo_description || form.excerpt || "").length}/160</span>
          </div>
          <Textarea id="seo_description" rows={2} placeholder={form.excerpt || "سيُؤخذ من الملخص"} className="resize-none"
            value={form.seo_description} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slug">الرابط الثابت (Slug)</Label>
          <Input id="slug" dir="ltr" className="font-mono" placeholder={generateUrlSlug(form.title) || "سيُولّد من العنوان"}
            value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
        </div>
      </div>

      {/* ── خيارات إضافية ── */}
      <div className="flex flex-wrap gap-3">
        <label className="flex items-center gap-2.5 cursor-pointer bg-card border border-border rounded-lg px-4 py-2.5">
          <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="w-4 h-4 accent-primary" />
          <span className="text-xs font-medium">⭐ خبر مميز (السلايدر)</span>
        </label>
        <label className="flex items-center gap-2.5 cursor-pointer bg-card border border-border rounded-lg px-4 py-2.5">
          <input type="checkbox" checked={form.is_opinion} onChange={(e) => setForm({ ...form, is_opinion: e.target.checked })} className="w-4 h-4 accent-primary" />
          <span className="text-xs font-medium">🖋 مقال رأي</span>
        </label>
        <label className="flex items-center gap-2.5 cursor-pointer bg-card border border-border rounded-lg px-4 py-2.5">
          <input type="checkbox" checked={form.is_pinned}
            onChange={(e) => setForm({ ...form, is_pinned: e.target.checked, pinned_order: e.target.checked ? form.pinned_order : "" })}
            className="w-4 h-4 accent-destructive" />
          <span className="text-xs font-medium text-destructive">📌 تثبيت في الأكثر قراءة</span>
        </label>
        {form.is_pinned && (
          <label className="flex items-center gap-2 cursor-pointer bg-card border border-border rounded-lg px-4 py-2.5">
            <span className="text-xs font-medium">الترتيب رقم</span>
            <input type="number" min={1} placeholder="مثال: 1" value={form.pinned_order}
              onChange={(e) => setForm({ ...form, pinned_order: e.target.value === "" ? "" : Number(e.target.value) })}
              className="w-16 h-8 text-center rounded border border-border text-sm font-bold bg-background" />
            <span className="text-[11px] text-muted-foreground">(اتركه فارغاً ليُرتب تلقائياً حسب المشاهدات)</span>
          </label>
        )}
      </div>

      {/* ── أزرار النشر ── */}
      <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border">
        <Button type="submit" disabled={save.isPending} className="flex-1 h-12 font-bold">
          <Save className="h-4 w-4" /> {save.isPending ? "جاري الحفظ..." : editingPost ? "تحديث الخبر" : "نشر الخبر"}
        </Button>
        {isAdmin && (
          <Button type="button" variant="secondary" disabled={save.isPending} onClick={handlePublishAndIndex} className="flex-1 h-12 font-bold">
            <Zap className="h-4 w-4" /> {save.isPending ? "جاري النشر..." : "نشر + فهرسة فورية"}
          </Button>
        )}
      </div>
    </form>
  );
}
