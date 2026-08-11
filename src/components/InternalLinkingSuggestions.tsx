import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getPostUrl as getPostPath } from "@/lib/postUrl";
import { SEO_SITE_URL } from "@/lib/seoHelpers";
import { Link2, ExternalLink, Copy, Check, Loader2, FileInput } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";

interface InternalLinkingSuggestionsProps {
  title: string;
  content: string;
  currentPostId?: string;
  onInsertLink?: (title: string, url: string) => void;
  onInsertMultipleLinks?: (links: Array<{ title: string; url: string }>) => void;
  onInsertToEditor?: (htmlBlock: string) => void;
}

// نفس منطق الجنوب فويس حرفياً — الفرق الوحيد: category نص هناك، وهنا نقرأ
// اسم القسم عبر علاقة categories(name) لأن شمسان نيوز يستخدم category_id (FK).
const STOP_WORDS = new Set([
  'في', 'من', 'على', 'إلى', 'عن', 'مع', 'هذا', 'هذه', 'التي', 'الذي',
  'أن', 'كان', 'بين', 'ما', 'لم', 'قد', 'بعد', 'قبل', 'أو', 'و', 'ال',
  'إن', 'لا', 'إذا', 'كل', 'ذلك', 'أي', 'هو', 'هي', 'نحن', 'هم', 'أنت',
  'لكن', 'حتى', 'عند', 'كما', 'ثم', 'أما', 'منذ', 'خلال', 'ضد', 'نحو',
  'بل', 'لو', 'إذ', 'مثل', 'تلك', 'هناك', 'أيضا', 'أيضاً', 'فقط', 'لأن'
]);

function extractKeywords(text: string): string[] {
  const words = text
    .replace(/[^\u0621-\u064A\u0660-\u0669a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));

  return [...new Set(words)];
}

function calculateRelevance(currentKeywords: string[], post: any): number {
  let score = 0;
  const postText = `${post.title} ${post.excerpt || ''} ${post.content?.substring(0, 500) || ''}`.toLowerCase();
  const postKeywords = new Set(extractKeywords(postText));

  for (const keyword of currentKeywords) {
    if (postKeywords.has(keyword.toLowerCase())) {
      score += 2;
    }
    if (post.title.includes(keyword)) {
      score += 5;
    }
  }

  if (post.tags) {
    for (const tag of post.tags) {
      if (currentKeywords.some(k => tag.includes(k) || k.includes(tag))) {
        score += 3;
      }
    }
  }

  if (post.keywords) {
    for (const kw of post.keywords) {
      if (currentKeywords.some(k => kw.includes(k) || k.includes(kw))) {
        score += 4;
      }
    }
  }

  return score;
}

function decodeArabicTitle(title: string): string {
  try {
    return decodeURIComponent(title);
  } catch {
    return title;
  }
}

function generateReadAlsoBlock(links: Array<{ title: string; url: string }>): string {
  if (links.length === 0) return '';

  const linksHtml = links
    .map(link => {
      const decodedTitle = decodeArabicTitle(link.title);
      return `<a href="${link.url}">${decodedTitle}</a>`;
    })
    .join('\n  ');

  return `<div class="read-also-box">
  <strong>اقرأ أيضاً:</strong>
  ${linksHtml}
</div>`;
}

export function InternalLinkingSuggestions({
  title,
  content,
  currentPostId,
  onInsertLink,
  onInsertMultipleLinks,
  onInsertToEditor
}: InternalLinkingSuggestionsProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [debouncedKeywords, setDebouncedKeywords] = useState<string[]>([]);

  const currentKeywords = useMemo(() => {
    const text = `${title} ${content}`;
    return extractKeywords(text);
  }, [title, content]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeywords(currentKeywords);
    }, 500);

    return () => clearTimeout(timer);
  }, [currentKeywords]);

  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ['internal-linking-suggestions', debouncedKeywords.slice(0, 10).join(',')],
    queryFn: async () => {
      if (debouncedKeywords.length === 0) return [];

      const { data, error } = await supabase
        .from('posts')
        .select('id, title, slug, excerpt, tags, keywords, content, created_at, categories(name)')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const scored = (data || [])
        .filter((post: any) => post.id !== currentPostId)
        .map((post: any) => ({
          ...post,
          categoryName: post.categories?.name ?? null,
          relevanceScore: calculateRelevance(debouncedKeywords, post)
        }))
        .filter((post: any) => post.relevanceScore > 3)
        .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore)
        .slice(0, 8);

      return scored;
    },
    enabled: debouncedKeywords.length > 0,
    staleTime: 30000,
  });

  const getPostUrl = (post: any) => {
    const path = getPostPath({
      id: post.id,
      created_at: post.created_at,
      slug: post.slug,
      title: post.title,
    });

    return `${SEO_SITE_URL}${path}`;
  };

  const handleCopyLink = async (post: any) => {
    const url = getPostUrl(post);
    const linkText = `<a href="${url}">${post.title}</a>`;

    try {
      await navigator.clipboard.writeText(linkText);
      setCopiedId(post.id);
      toast.success("تم نسخ الرابط");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("فشل نسخ الرابط");
    }
  };

  const handleToggleSelect = (postId: string) => {
    setSelectedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedPosts.size === suggestions.length) {
      setSelectedPosts(new Set());
    } else {
      setSelectedPosts(new Set(suggestions.map((p: any) => p.id)));
    }
  };

  const handleInsertSelected = () => {
    const selectedLinks = suggestions
      .filter((post: any) => selectedPosts.has(post.id))
      .map((post: any) => ({
        title: decodeArabicTitle(post.title),
        url: getPostUrl(post)
      }));

    if (selectedLinks.length === 0) {
      toast.error("يرجى اختيار رابط واحد على الأقل");
      return;
    }

    const htmlBlock = generateReadAlsoBlock(selectedLinks);

    if (onInsertToEditor) {
      onInsertToEditor(htmlBlock);
      toast.success(`تم إدراج ${selectedLinks.length} روابط في المحتوى`);
      setSelectedPosts(new Set());

      if (onInsertMultipleLinks) {
        onInsertMultipleLinks(selectedLinks);
      }
      return;
    }

    try {
      navigator.clipboard.writeText(htmlBlock);
      toast.success(`تم نسخ ${selectedLinks.length} روابط في صندوق "اقرأ أيضاً"`);

      if (onInsertMultipleLinks) {
        onInsertMultipleLinks(selectedLinks);
      }

      setSelectedPosts(new Set());
    } catch {
      toast.error("فشل نسخ الروابط");
    }
  };

  const handleInsertLink = (post: any) => {
    if (onInsertLink) {
      onInsertLink(post.title, getPostUrl(post));
    }
  };

  if (!title && !content) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Link2 className="h-4 w-4 text-primary" />
            اقتراحات الروابط الداخلية (اقرأ أيضاً)
          </CardTitle>
          {suggestions.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs h-7"
              >
                {selectedPosts.size === suggestions.length ? 'إلغاء الكل' : 'تحديد الكل'}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="mr-2 text-sm text-muted-foreground">جاري البحث...</span>
          </div>
        ) : suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            {currentKeywords.length === 0
              ? "ابدأ بكتابة العنوان والمحتوى للحصول على اقتراحات"
              : "لم يتم العثور على مقالات ذات صلة"
            }
          </p>
        ) : (
          <div className="space-y-2">
            {suggestions.map((post: any) => (
              <div
                key={post.id}
                className={`flex items-start gap-2 p-2 rounded-md bg-background border transition-all ${
                  selectedPosts.has(post.id)
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'hover:border-primary/50'
                }`}
              >
                <Checkbox
                  checked={selectedPosts.has(post.id)}
                  onCheckedChange={() => handleToggleSelect(post.id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1">{post.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {post.categoryName && (
                      <Badge variant="secondary" className="text-xs">
                        {post.categoryName}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      تطابق: {post.relevanceScore}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleCopyLink(post)}
                    title="نسخ كود الرابط"
                  >
                    {copiedId === post.id ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => window.open(getPostUrl(post), '_blank')}
                    title="فتح في نافذة جديدة"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}

            {selectedPosts.size > 0 && (
              <div className="pt-3 border-t mt-3">
                <Button
                  type="button"
                  onClick={handleInsertSelected}
                  className="w-full bg-primary hover:bg-primary/90"
                  size="sm"
                >
                  <FileInput className="h-4 w-4 ml-2" />
                  {onInsertToEditor
                    ? `إدراج ${selectedPosts.size} روابط في المحتوى`
                    : `نسخ ${selectedPosts.size} روابط كـ "اقرأ أيضاً"`
                  }
                </Button>
              </div>
            )}

            <div className="pt-2 text-xs text-muted-foreground space-y-1">
              <p>💡 حدد عدة روابط ثم اضغط الزر لإدراجها مباشرة في المحتوى</p>
              <p>📋 سيتم إدراج صندوق "اقرأ أيضاً" احترافي بتنسيق جاهز</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
