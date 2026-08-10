# Shmsan News Hub

أنشئ موقعًا إخباريًا عربيًا (RTL) باسم "شمسان نيوز" — تطبيق React + TypeScript + Vite + Tailwind + shadcn/ui + Supabase (full-stack).

## 1) هيكلة الموقع العام (الواجهة)
انسخ نفس الأقسام والوظائف التالية من موقع إخباري مرجعي، لكن بتصميم بصري احترافي عالمي نظيف وحديث (مثل Al Jazeera / Reuters) — بدون ازدحام، بدون تكرار محتوى، تسلسل بصري واضح، مساحات بيضاء مدروسة، طباعة عربية أنيقة:

الأقسام (تصنيفات):
- الرئيسية
- أهم الأخبار
- شمسان اليوم (قسم محلي/إخباري رئيسي)
- مقالات وآراء
- مختارات (مع قسم فرعي: صورة وتعليق)
- تاريخ وتراث
- تحت المجهر (تحليلات)
- إضاءات عسكرية

الصفحة الرئيسية تتضمن:
- Header: شعار + قائمة تنقل بالأقسام + بحث
- شريط أخبار عاجلة (Breaking News ticker) متحرك أعلى الصفحة
- Hero Slider لأهم 3-5 أخبار مميزة بصور كبيرة
- قسم "الأكثر قراءة" (Most Read) بشريط جانبي
- أقسام أخبار لكل تصنيف (NewsSection) بتصميم بطاقات (NewsCard) نظيف
- قسم مقالات الرأي مع صورة الكاتب واسمه
- عرض أسعار العملات والذهب (Currency & Gold prices widget)
- مساحات إعلانية محددة وغير مزدحمة (AdSlot)
- Footer احترافي مع روابط تواصل اجتماعي

صفحات إضافية:
- صفحة المقال الكامل (مع مسار SEO-friendly بصيغة /:year/:month/:day/:slug)
- صفحة التصنيف /category/:slug
- صفحة "الأكثر قراءة" الكاملة
- صفحة "من نحن"
- صفحة موجز RSS
- صفحة تسجيل الدخول /auth
- صفحة 404 مخصصة

## 2) لوحة الإدارة (Admin Panel) — يجب أن تكون مطابقة تمامًا من ناحية الوظائف والصفحات والحقول لنظام إدارة محتوى إخباري احترافي متكامل:

بنية القائمة الجانبية للوحة الإدارة (بالترتيب):
1. لوحة التحكم (Dashboard) — إحصائيات: إجمالي الأخبار، الأقسام، الكتّاب، إجمالي المشاهدات + قائمة أحدث الأخبار + الأكثر مشاهدة
2. الأخبار (Posts) — قائمة كل الأخبار مع حالة النشر (مسودة/منشور/مجدول)، بحث وفلترة
3. محرر الأخبار (Post Editor) — نموذج كامل لإنشاء/تعديل خبر: عنوان، محتوى (rich text)، صورة رئيسية، تصنيف، وسوم، كاتب، حالة نشر، جدولة نشر، SEO meta
4. الأقسام (Categories) — إدارة كاملة CRUD للتصنيفات مع ترتيب وأقسام فرعية
5. الكتّاب (Authors) — إدارة الكتّاب وصورهم ونبذاتهم
6. الأخبار العاجلة (Breaking News) — إدارة شريط الأخبار العاجلة المتحرك
7. الوسائط (Media) — مكتبة صور مركزية للرفع والاستخدام
8. الوسوم (Tags) — إدارة الوسوم/الكلمات المفتاحية
9. إدارة المحررين (Editors) — صلاحيات المستخدمين وأدوارهم (admin/editor)
10. الإعلانات (Ads) — إدارة البانرات الإعلانية ومواضعها
11. الصيانة والأرشفة (Maintenance) — أدوات صيانة النظام وأرشفة المحتوى القديم
12. الإعدادات (Settings) — إعدادات الموقع العامة (الاسم، الشعار، روابط التواصل، SEO)
13. الملف الشخصي (Profile) — إعدادات حساب المستخدم الحالي

مزايا إضافية مطلوبة في اللوحة:
- نظام مصادقة كامل عبر Supabase Auth (تسجيل دخول/خروج)، حماية مسارات /admin بالكامل بحيث تتطلب تسجيل دخول
- أدوار مستخدمين (admin, editor) مع صلاحيات متفاوتة
- استيراد أخبار من ملف JSON (JSON News Importer) كأداة مساعدة في لوحة الإدارة
- عداد مشاهدات لكل خبر
- دعم النشر المجدول (scheduled publishing)

## 3) قاعدة البيانات (Supabase)
أنشئ Schema كامل يشمل جداول: posts (الأخبار)، categories (الأقسام مع دعم أقسام فرعية parent_id)، authors (الكتّاب)، tags (الوسوم)، post_tags (ربط)، breaking_news، ads، media، profiles (مستخدمين وأدوارهم)، site_settings.
فعّل Row Level Security بحيث: القراءة العامة للمحتوى المنشور فقط، الكتابة محصورة على admin/editor المسجلين.

## 4) التصميم
- اسم الموقع: "شمسان نيوز"
- حرية كاملة في اختيار نظام الألوان والخطوط والتايبوغرافي، بشرط أن يكون احترافيًا بمستوى وكالات أنباء عالمية حديثة (هوية بصرية متماسكة، تباين ألوان قوي وواضح، خط عربي حديث مقروء)
- تصميم متجاوب بالكامل (mobile-first) لأن أغلب القراء يتصفحون من الجوال
- دعم RTL كامل

ابدأ ببناء الهيكل الأساسي: التخطيط العام (Layout, Header, Footer, Navigation)، الصفحة الرئيسية، ثم صفحة المقال والتصنيف، ثم لوحة الإدارة الكاملة مع المصادقة، ثم قاعدة البيانات والصلاحيات.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e0e2a7eb-c46d-4456-a481-7bb0671ce90b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
