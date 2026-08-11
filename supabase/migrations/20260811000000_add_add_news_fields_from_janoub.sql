-- إضافة نفس الحقول المستخدمة بصفحة "إضافة خبر" في الجنوب فويس إلى جدول
-- posts بشمسان نيوز، مع إبقاء category_id (ربط بجدول الأقسام) كما هو —
-- خلافاً للجنوب فويس التي تخزّن اسم القسم كنص حر مباشرة.

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS badge TEXT,
  ADD COLUMN IF NOT EXISTS external_video_url TEXT,
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pinned_order INT,
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS keywords TEXT[],
  ADD COLUMN IF NOT EXISTS word_count INT,
  ADD COLUMN IF NOT EXISTS reading_time INT,
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS posts_is_pinned_idx ON public.posts (is_pinned, pinned_order);

-- جدول الوسائط الإضافية (صور/فيديوهات) المرفقة بالخبر، بنفس بنية الجنوب فويس
CREATE TABLE IF NOT EXISTS public.post_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  file_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_post_media_post_id ON public.post_media(post_id);

GRANT SELECT ON public.post_media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_media TO authenticated;
GRANT ALL ON public.post_media TO service_role;
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_media public read" ON public.post_media FOR SELECT USING (true);
CREATE POLICY "post_media staff write" ON public.post_media FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
