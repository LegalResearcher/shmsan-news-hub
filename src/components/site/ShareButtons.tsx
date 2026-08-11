import { useState } from "react";
import { Facebook, Twitter, MessageCircle, Send, Copy, Check, Share2 } from "lucide-react";

const TELEGRAM_CHANNEL = "https://t.me/shmsannews";
const FOLLOW_LINE = `للمزيد من الأخبار العاجلة تابعونا على تليجرام: ${TELEGRAM_CHANNEL}`;

function getShareUrl() {
  if (typeof window === "undefined") return "";
  // إرجاع الرابط لشكله العربي المقروء بدل الترميز %D8%... القبيح، مع بقائه رابطاً صحيحاً وشغّالاً
  try {
    return decodeURI(window.location.href);
  } catch {
    return window.location.href;
  }
}

function buildShareText(title: string, url: string) {
  return `${title}\n\n${url}\n\n${FOLLOW_LINE}`;
}

interface ShareButtonsProps {
  title: string;
  postId: string;
}

export function ShareButtons({ title, postId }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  // رابط مشاركة قصير وثابت (ASCII بالكامل: /share/<id>) - يعطي بطاقة معاينة صحيحة
  // وشكل رابط نظيف على تويتر بدل الرابط الطويل بالتاريخ والعنوان العربي
  function getShortShareUrl() {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/share/${postId}`;
  }

  function openShareWindow(url: string) {
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=500");
  }

  async function copyLink() {
    const url = getShareUrl();
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // خطة بديلة في حال فشل الـ Clipboard API
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareFacebook() {
    const url = getShareUrl();
    openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
  }

  function shareTwitter() {
    const url = getShortShareUrl();
    const text = buildShareText(title, url);
    // الرابط مضمّن داخل النص لضبط الترتيب (العنوان ثم الرابط ثم عبارة المتابعة)
    openShareWindow(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`);
  }

  function shareWhatsApp() {
    const url = getShareUrl();
    const text = buildShareText(title, url);
    openShareWindow(`https://wa.me/?text=${encodeURIComponent(text)}`);
  }

  function shareTelegram() {
    const url = getShareUrl();
    const text = buildShareText(title, url);
    // بدون معامل url منفصل، حتى لا يكرر تليجرام الرابط أو يغيّر ترتيبه
    openShareWindow(`https://t.me/share/url?url=&text=${encodeURIComponent(text)}`);
  }

  const buttons = [
    {
      label: "نسخ الرابط",
      icon: copied ? Check : Copy,
      onClick: copyLink,
      circleClass: copied ? "bg-green-600 text-white" : "bg-muted text-foreground",
    },
    {
      label: "تليجرام",
      icon: Send,
      onClick: shareTelegram,
      circleClass: "bg-[#26A5E4] text-white",
    },
    {
      label: "واتساب",
      icon: MessageCircle,
      onClick: shareWhatsApp,
      circleClass: "bg-[#25D366] text-white",
    },
    {
      label: "تويتر",
      icon: Twitter,
      onClick: shareTwitter,
      circleClass: "bg-black text-white",
    },
    {
      label: "فيسبوك",
      icon: Facebook,
      onClick: shareFacebook,
      circleClass: "bg-[#1877F2] text-white",
    },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center justify-center gap-2 pb-4">
        <span className="text-base font-bold text-foreground">شارك الخبر</span>
        <Share2 className="h-4 w-4 text-accent" />
      </div>
      <div className="flex flex-wrap items-start justify-center gap-6 pt-5">
        {buttons.map((b) => (
          <button
            key={b.label}
            type="button"
            onClick={b.onClick}
            aria-label={b.label === "نسخ الرابط" && copied ? "تم نسخ الرابط" : b.label}
            className="flex flex-col items-center gap-1.5"
          >
            <span
              className={`grid h-12 w-12 place-items-center rounded-full transition-colors ${b.circleClass}`}
            >
              <b.icon className="h-5 w-5" />
            </span>
            <span className="text-xs font-semibold text-muted-foreground">{b.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
