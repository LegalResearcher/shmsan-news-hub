/**
 * Headline Band Design Utility - South Voice
 * نفس منطق apply_headline_design_to_image() في janoub_news_bot.py حرفياً،
 * لكن بلغة Canvas API بدل Pillow. يُنتج صورة الخبر بنفس نسبة OG (1200×630)
 * مع شريط سفلي بخط علوي مستقيم (كحلي + خط حافة أحمر رفيع + تدرّج تعتيم
 * ناعم فوقه يذوب داخل الصورة الأصلية) فيه شعار الموقع + اسمه يسار الشريط،
 * وعنوان الخبر يمين الشريط. العنوان يظهر كاملاً دائماً بدون أي قص — الخط
 * يصغر تلقائياً والشريط يكبر تلقائياً عند الحاجة.
 *
 * ⚠️ أي تعديل بالألوان/الأبعاد هنا لازم ينعكس بنفس القيم بملف
 * janoub_news_bot.py (الثوابت HEADLINE_* وWATERMARK_OG_*) وإلا صار شكل
 * الصورة مختلف حسب مصدر النشر (يدوي عبر Admin Panel أو آلي عبر البوت).
 */

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

const BAND_HEIGHT_PERCENT = 0.33;
const LINE_THICKNESS = 3; // سمك الخط المستقيم العلوي (بدل انحناء الموجة)
const FADE_H = 90; // ارتفاع تدرّج التعتيم فوق الشريط الذي يذوب داخل الصورة

// نفس ألوان هوية الموقع تمامًا (primary/accent بملف styles.css محوّلة من oklch
// إلى rgb)، لكن بتدرّج أعمق وأغمق (broadcast-style) بدل الكحلي الفاتح —
// يعطي تباينًا وإحساسًا احترافيًا أقرب لقنوات عالمية (BBC / الجزيرة).
const BAND_COLOR_TOP = "rgb(14, 20, 32)"; // primary الموقع تقريبًا
const BAND_COLOR_BOTTOM = "rgb(6, 9, 16)"; // أغمق نحو الأسود لعمق أكبر
const CURVE_COLOR = "rgb(194, 21, 47)"; // accent الموقع تمامًا — لون الخط المستقيم العلوي
const HAIRLINE_COLOR = "rgba(255, 255, 255, 0.18)"; // خط شعرة أبيض فوق الخط الأحمر مباشرة — يعطي عمقًا "منحوتًا"
const TEXT_COLOR = "rgb(248, 248, 246)";
const TEXT_SHADOW_COLOR = "rgba(0, 0, 0, 0.55)"; // ظل خفيف خلف العنوان لوضوح أعلى فوق أي صورة
const SITE_BADGE_BG = "rgb(194, 21, 47)"; // شارة حمراء مصمتة خلف اسم الموقع (بدل نص أحمر عادي) — أسلوب "channel bug" عالمي
const SITE_BADGE_TEXT = "rgb(255, 255, 255)";
const LOGO_DISC_BG = "rgba(255, 255, 255, 0.94)"; // قرص دائري ناعم خلف الشعار بدل مربع أبيض حاد
const LOGO_DISC_RING = "rgba(255, 255, 255, 0.22)"; // حلقة رفيعة حول القرص
const DIVIDER_COLOR_MID = "rgba(255, 255, 255, 0.28)"; // فاصل متدرّج (يذوب من الطرفين) بين كتلة الشعار وكتلة العنوان
const ACCENT_COLOR = "rgb(194, 21, 47)"; // أحمر — الشريط العمودي الصغير (kicker) جنب العنوان

const HEADLINE_FONT_SIZE = 54;
const HEADLINE_FONT_MIN_SIZE = 30; // أصغر حجم خط مسموح قبل تكبير الشريط بدل قصّ النص
const SITE_FONT_SIZE = 45;
const HEADLINE_MAX_LINES = 2; // عدد الأسطر "المفضّل" فقط — لا يُستخدم للقص أبداً
const MIN_PHOTO_VISIBLE = 90; // أقل ارتفاع من الصورة الأصلية يبقى ظاهراً فوق الشريط دائماً
const LOGO_SIZE = 108;

const TOP_PAD = 26; // خط علوي مستقيم بدل موجة — لا حاجة لهامش تغطية انحناء
const BOTTOM_PAD = 20;
const LEFT_MARGIN = 30;
const RIGHT_MARGIN = 40;
const GAP_BETWEEN = 30;
const DIVIDER_GAP = 26; // مسافة الفاصل الرفيع بين كتلة الشعار/الاسم وكتلة العنوان
const ACCENT_BAR_W = 4; // عرض الشريط الأحمر الصغير (kicker)
const ACCENT_GAP = 18; // مسافة بين الشريط الأحمر وبداية نص العنوان
const LOGO_DISC_PAD = 14; // هامش القرص الدائري حول الشعار
const BADGE_PAD_X = 20; // حشوة أفقية داخل شارة اسم الموقع الحمراء
const BADGE_PAD_Y = 12; // حشوة رأسية داخل شارة اسم الموقع الحمراء
const BADGE_RADIUS = 8; // استدارة زوايا شارة اسم الموقع

// نفس الخط الفعلي المستخدم بالموقع (IBM Plex Arabic بوزن Bold)، بدل
// Amiri-Bold المستخدم بنسخة البوت — أقرب لهوية الموقع البصرية الفعلية.
const FONT_FAMILY = '"IBM Plex Arabic", sans-serif';

export interface HeadlineDesignResult {
  blob: Blob;
  previewUrl: string;
  width: number;
  height: number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (src.startsWith("http")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("فشل في تحميل الصورة، تأكد من المسار وصيغة الملف"));
    img.src = src;
  });
}

function loadImageFromFile(file: File): Promise<{ img: HTMLImageElement; objectUrl: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => resolve({ img, objectUrl: url });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("فشل في قراءة ملف الصورة المرفوع"));
    };
    img.src = url;
  });
}

async function ensureFontsReady(): Promise<void> {
  try {
    await Promise.all([
      document.fonts.load(`700 ${HEADLINE_FONT_SIZE}px ${FONT_FAMILY}`),
      document.fonts.load(`700 ${SITE_FONT_SIZE}px ${FONT_FAMILY}`),
    ]);
  } catch {
    // لو تعذّر تحميل الخط بشكل استباقي، نتابع برسم الكانفاس على أي حال
    // (المتصفح سيستخدم بديل النظام).
  }
}

/** يلف نص عربي لأسطر لا تتجاوز max_width بالبكسل، بنفس أسلوب _headline_wrap_text */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = (cur + " " + w).trim();
    const width = ctx.measureText(test).width;
    if (width <= maxWidth || !cur) {
      cur = test;
    } else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

/** يرسم الشريط السفلي بحافة علوية مستقيمة (تدرّج كحلي + خط حافة أحمر رفيع + تعتيم ناعم فوقه) */
function drawBand(ctx: CanvasRenderingContext2D, width: number, height: number, bandH: number) {
  const topY = height - bandH;
  const fadeH = Math.min(FADE_H, topY);
  const fadeTop = topY - fadeH;

  // تدرّج تعتيم ناعم فوق الشريط يذوب داخل الصورة الأصلية (بدل القطع الفجائي)
  if (fadeH > 0) {
    const fadeGradient = ctx.createLinearGradient(0, fadeTop, 0, topY);
    fadeGradient.addColorStop(0, "rgba(6, 9, 16, 0)");
    fadeGradient.addColorStop(1, "rgba(6, 9, 16, 1)");
    ctx.fillStyle = fadeGradient;
    ctx.fillRect(0, fadeTop, width, fadeH);
  }

  // تدرّج رأسي عبر كامل ارتفاع الشريط — من كحلي هوية الموقع أعلى الشريط
  // إلى أسود شبه كامل أسفله (معتم بالكامل)، لعمق وتباين أقوى بأسلوب البث
  // الإخباري العالمي بدل اللون الكحلي المسطّح الفاتح
  const gradient = ctx.createLinearGradient(0, topY, 0, height);
  gradient.addColorStop(0, BAND_COLOR_TOP);
  gradient.addColorStop(1, BAND_COLOR_BOTTOM);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, topY, width, bandH);

  // خط شعرة أبيض خفيف فوق الخط الأحمر مباشرة — يعطي إحساس "حافة منحوتة"
  // بدل خط أحمر مسطّح وحيد
  ctx.fillStyle = HAIRLINE_COLOR;
  ctx.fillRect(0, topY - LINE_THICKNESS - 1, width, 1);

  // خط الحافة العلوية — مستقيم رفيع بلون الـ accent الفعلي للموقع
  ctx.fillStyle = CURVE_COLOR;
  ctx.fillRect(0, topY - LINE_THICKNESS, width, LINE_THICKNESS);
}

/** يرسم زاوية مستديرة موحّدة (Path) — بديل خفيف الوزن عن roundRect لدعم متصفحات أقدم */
function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * الوظيفة الرئيسية: تصميم صورة الخبر بشريط العنوان (شعار + اسم الموقع +
 * عنوان الخبر) — نفس apply_headline_design_to_image() بالبوت حرفياً.
 */
export async function applyHeadlineDesign(
  imageSource: string | File,
  logoSrc: string,
  headlineText: string,
  siteName: string = "شمسان نيوز"
): Promise<HeadlineDesignResult> {
  let objectUrlToRevoke: string | null = null;

  try {
    await ensureFontsReady();

    const mainImage =
      typeof imageSource === "string"
        ? await loadImage(imageSource)
        : await (async () => {
            const { img, objectUrl } = await loadImageFromFile(imageSource);
            objectUrlToRevoke = objectUrl;
            return img;
          })();

    const logo = await loadImage(logoSrc);

    const canvas = document.createElement("canvas");
    canvas.width = OG_WIDTH;
    canvas.height = OG_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("فشل في تهيئة نظام الرسم (Canvas)");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // 1) قصّ مركزي لنسبة OG (نفس منطق العلامة المائية)
    const sourceAspect = mainImage.naturalWidth / mainImage.naturalHeight;
    const targetAspect = OG_WIDTH / OG_HEIGHT;
    let sx = 0,
      sy = 0,
      sw = mainImage.naturalWidth,
      sh = mainImage.naturalHeight;
    if (sourceAspect > targetAspect) {
      sw = mainImage.naturalHeight * targetAspect;
      sx = (mainImage.naturalWidth - sw) / 2;
    } else {
      sh = mainImage.naturalWidth / targetAspect;
      sy = (mainImage.naturalHeight - sh) / 2;
    }
    ctx.drawImage(mainImage, sx, sy, sw, sh, 0, 0, OG_WIDTH, OG_HEIGHT);

    // 2) قياس مسبق لعرض كتلة الشعار+الاسم (لا يعتمد على ارتفاع الشريط)
    //    عشان نعرف العرض المتاح للعنوان قبل تحديد حجم الخط النهائي.
    //    الشعار الآن داخل قرص دائري ناعم، واسم الموقع داخل شارة حمراء
    //    مصمتة (بدل نص أحمر عادٍ على الخلفية) — لذا نحسب أبعادهما الفعلية
    //    بما فيها الحشوة.
    const logoScale = Math.min(LOGO_SIZE / logo.naturalWidth, LOGO_SIZE / logo.naturalHeight, 1);
    const logoW = logo.naturalWidth * logoScale;
    const logoH = logo.naturalHeight * logoScale;
    const logoDiscSize = Math.max(logoW, logoH) + LOGO_DISC_PAD * 2;

    ctx.direction = "rtl";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = `700 ${SITE_FONT_SIZE}px ${FONT_FAMILY}`;
    const siteGap = 26;
    const siteX = LEFT_MARGIN + logoDiscSize + siteGap;
    const siteTextW = ctx.measureText(siteName).width;
    const badgeW = siteTextW + BADGE_PAD_X * 2;
    const badgeH = SITE_FONT_SIZE + BADGE_PAD_Y * 2;
    const leftBlockEndX = siteX + badgeW + DIVIDER_GAP;
    const accentX = leftBlockEndX + GAP_BETWEEN;
    const textStartX = accentX + ACCENT_BAR_W + ACCENT_GAP;
    const maxTextW = Math.max(100, OG_WIDTH - RIGHT_MARGIN - textStartX);

    // 3) العنوان يُعرض كاملاً دائماً مهما طال — بدون أي قص أو حذف كلمات.
    //    نصغّر الخط تدريجياً حتى الحد الأدنى إن لم يتّسع بعدد الأسطر
    //    المفضّل، وإن ظل النص أطول نكتفي بأكبر عدد أسطر ينتجه أصغر خط —
    //    wrapText لا يحذف كلمات أبداً، فقط يلفّها على أسطر إضافية.
    const trimmedHeadline = headlineText.trim();
    let fontSize = HEADLINE_FONT_SIZE;
    let lines: string[] = [];
    while (true) {
      ctx.font = `700 ${fontSize}px ${FONT_FAMILY}`;
      lines = wrapText(ctx, trimmedHeadline, maxTextW);
      if (lines.length <= HEADLINE_MAX_LINES || fontSize <= HEADLINE_FONT_MIN_SIZE) break;
      fontSize -= 2;
    }
    const lineH = fontSize * 1.25;
    const textBlockH = lineH * lines.length;

    // 4) ارتفاع الشريط: نسبة افتراضية للعناوين القصيرة، ويكبر تلقائياً
    //    إن احتاج العنوان مساحة أكثر — بحد أقصى يترك جزءاً من الصورة
    //    الأصلية ظاهراً فوق الشريط دائماً
    const defaultBandH = Math.round(OG_HEIGHT * BAND_HEIGHT_PERCENT);
    const maxBandH = OG_HEIGHT - MIN_PHOTO_VISIBLE;
    const requiredBandH = TOP_PAD + BOTTOM_PAD + Math.max(logoDiscSize, textBlockH);
    const bandH = Math.max(defaultBandH, Math.min(requiredBandH, maxBandH));

    drawBand(ctx, OG_WIDTH, OG_HEIGHT, bandH);

    const rowTop = OG_HEIGHT - bandH + TOP_PAD;
    const rowBottom = OG_HEIGHT - BOTTOM_PAD;
    const rowCenterY = (rowTop + rowBottom) / 2;

    // 5) الشعار داخل قرص دائري ناعم (بدل مربع أبيض حاد) بظل خفيف يفصله عن
    //    الخلفية، ثم اسم الموقع داخل شارة حمراء مصمتة نصها أبيض — أسلوب
    //    "channel bug" المعتمد بالقنوات الإخبارية العالمية بدل نص أحمر عادي
    const logoDiscX = LEFT_MARGIN;
    const logoDiscY = rowCenterY - logoDiscSize / 2;
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = LOGO_DISC_BG;
    roundedRectPath(ctx, logoDiscX, logoDiscY, logoDiscSize, logoDiscSize, logoDiscSize / 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = LOGO_DISC_RING;
    ctx.lineWidth = 1.5;
    roundedRectPath(
      ctx,
      logoDiscX + 0.75,
      logoDiscY + 0.75,
      logoDiscSize - 1.5,
      logoDiscSize - 1.5,
      (logoDiscSize - 1.5) / 2
    );
    ctx.stroke();
    ctx.restore();

    const logoX = logoDiscX + (logoDiscSize - logoW) / 2;
    const logoY = logoDiscY + (logoDiscSize - logoH) / 2;
    ctx.drawImage(logo, logoX, logoY, logoW, logoH);

    const badgeY = rowCenterY - badgeH / 2;
    ctx.fillStyle = SITE_BADGE_BG;
    roundedRectPath(ctx, siteX, badgeY, badgeW, badgeH, BADGE_RADIUS);
    ctx.fill();

    ctx.font = `700 ${SITE_FONT_SIZE}px ${FONT_FAMILY}`;
    ctx.fillStyle = SITE_BADGE_TEXT;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(siteName, siteX + BADGE_PAD_X, rowCenterY + 1);

    // فاصل رفيع يذوب من طرفيه (تدرّج شفافية) بين كتلة الشعار/الاسم وكتلة
    // العنوان — أنعم من خط ثابت الشفافية، يمنح توازناً واضحاً بين يمين
    // الصورة ويسارها دون أن يبدو كخط قاطع صلب
    const dividerX = siteX + badgeW + DIVIDER_GAP;
    const dividerGradient = ctx.createLinearGradient(0, rowTop, 0, rowBottom);
    dividerGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
    dividerGradient.addColorStop(0.5, DIVIDER_COLOR_MID);
    dividerGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.save();
    ctx.strokeStyle = dividerGradient;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(dividerX, rowTop);
    ctx.lineTo(dividerX, rowBottom);
    ctx.stroke();
    ctx.restore();

    // 6) عنوان الخبر يمين الشريط — كل الأسطر تُرسم كاملة (lines أعلاه لا تُقصّ إطلاقاً)
    const startY = rowCenterY - textBlockH / 2 + lineH / 2;
    const rightEdge = OG_WIDTH - RIGHT_MARGIN;

    // شريط أحمر عمودي صغير مستدير الزوايا (kicker) يفتح كتلة العنوان — لمسة القنوات العالمية
    ctx.fillStyle = ACCENT_COLOR;
    roundedRectPath(ctx, accentX, rowCenterY - textBlockH / 2, ACCENT_BAR_W, textBlockH, 2);
    ctx.fill();

    // ظل خفيف خلف نص العنوان لوضوح أعلى فوق أي صورة خلفية، مهما كانت مزدحمة
    ctx.save();
    ctx.font = `700 ${fontSize}px ${FONT_FAMILY}`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.shadowColor = TEXT_SHADOW_COLOR;
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = TEXT_COLOR;
    lines.forEach((line, i) => {
      ctx.fillText(line, rightEdge, startY + i * lineH);
    });
    ctx.restore();

    // 7) توليد المخرجات النهائية بصيغة WebP
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("فشل في إنشاء Blob"))), "image/webp", 0.9);
    });
    const previewUrl = canvas.toDataURL("image/webp", 0.9);

    if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);

    return { blob, previewUrl, width: OG_WIDTH, height: OG_HEIGHT };
  } catch (error) {
    if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
    console.error("Headline Design Error:", error);
    throw error;
  }
}

/** دالة مساعدة لتوليد معاينة سريعة */
export async function generateHeadlineDesignPreview(
  imageUrl: string,
  logoSrc: string,
  headlineText: string,
  siteName?: string
): Promise<string> {
  const result = await applyHeadlineDesign(imageUrl, logoSrc, headlineText, siteName);
  return result.previewUrl;
}
