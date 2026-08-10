import { Facebook, Twitter, MessageCircle, Send } from "lucide-react";

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

function buildShareText(title: string) {
  return `${title}\n\n${FOLLOW_LINE}`;
}

interface ShareButtonsProps {
  title: string;
}

export function ShareButtons({ title }: ShareButtonsProps) {
  function openShareWindow(url: string) {
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=500");
  }

  function shareFacebook() {
    const url = getShareUrl();
    openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
  }

  function shareTwitter() {
    const url = getShareUrl();
    const text = buildShareText(title);
    openShareWindow(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    );
  }

  function shareWhatsApp() {
    const url = getShareUrl();
    const text = `${buildShareText(title)}\n\n${url}`;
    openShareWindow(`https://wa.me/?text=${encodeURIComponent(text)}`);
  }

  function shareTelegram() {
    const url = getShareUrl();
    const text = buildShareText(title);
    openShareWindow(
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
    );
  }

  const buttons = [
    { label: "فيسبوك", icon: Facebook, onClick: shareFacebook, className: "hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2]" },
    { label: "إكس", icon: Twitter, onClick: shareTwitter, className: "hover:bg-black hover:text-white hover:border-black" },
    { label: "واتساب", icon: MessageCircle, onClick: shareWhatsApp, className: "hover:bg-[#25D366] hover:text-white hover:border-[#25D366]" },
    { label: "تليجرام", icon: Send, onClick: shareTelegram, className: "hover:bg-[#26A5E4] hover:text-white hover:border-[#26A5E4]" },
  ];

  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-bold text-muted-foreground">مشاركة:</span>
      {buttons.map((b) => (
        <button
          key={b.label}
          type="button"
          onClick={b.onClick}
          aria-label={`مشاركة عبر ${b.label}`}
          className={`grid h-8 w-8 place-items-center rounded-full border border-border text-muted-foreground transition-colors ${b.className}`}
        >
          <b.icon className="h-4 w-4" />
        </button>
      ))}
    </span>
  );
}
