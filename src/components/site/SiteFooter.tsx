import { Link } from "@tanstack/react-router";
import { Facebook, Youtube, Send, MessageCircle, Twitter, Rss } from "lucide-react";
import type { CategoryRow } from "@/lib/news.types";

const socials = [
  { icon: Facebook, label: "فيسبوك", href: "https://facebook.com" },
  { icon: Twitter, label: "إكس", href: "https://x.com" },
  { icon: Youtube, label: "يوتيوب", href: "https://youtube.com" },
  { icon: Send, label: "تيليجرام", href: "https://telegram.org" },
  { icon: MessageCircle, label: "واتساب", href: "https://whatsapp.com" },
];

export function SiteFooter({ categories = [] }: { categories?: CategoryRow[] }) {
  const main = categories.filter((c) => !c.parent_id);

  return (
    <footer className="mt-16 bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded bg-accent font-display text-lg font-black text-accent-foreground">
              ش
            </span>
            <span className="font-display text-xl font-black">شمسان نيوز</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-7 text-ink-foreground/70">
            بوابة إخبارية مستقلة تنقل الخبر بمهنية وتقدم تحليلات ومقالات رأي وتقارير ميدانية من قلب
            الحدث.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="grid h-9 w-9 place-items-center rounded border border-white/15 transition-colors hover:bg-accent"
              >
                <s.icon className="h-4 w-4" />
              </a>
            ))}
            <Link
              to="/rss"
              aria-label="موجز RSS"
              className="grid h-9 w-9 place-items-center rounded border border-white/15 transition-colors hover:bg-accent"
            >
              <Rss className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-extrabold">الأقسام</h2>
          <ul className="mt-4 space-y-2 text-sm text-ink-foreground/70">
            {main.map((cat) => (
              <li key={cat.id}>
                <Link
                  to="/category/$slug"
                  params={{ slug: cat.slug }}
                  className="transition-colors hover:text-accent"
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-extrabold">روابط</h2>
          <ul className="mt-4 space-y-2 text-sm text-ink-foreground/70">
            <li>
              <Link to="/about" className="transition-colors hover:text-accent">
                من نحن
              </Link>
            </li>
            <li>
              <Link to="/most-read" className="transition-colors hover:text-accent">
                الأكثر قراءة
              </Link>
            </li>
            <li>
              <Link to="/rss" className="transition-colors hover:text-accent">
                موجز RSS
              </Link>
            </li>
            <li>
              <Link to="/auth" className="transition-colors hover:text-accent">
                دخول المحررين
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-ink-foreground/60">
        © {new Date().getFullYear()} شمسان نيوز — جميع الحقوق محفوظة
      </div>
    </footer>
  );
}