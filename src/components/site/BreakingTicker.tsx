import { Link } from "@tanstack/react-router";
import type { BreakingItem } from "@/lib/news.types";

export function BreakingTicker({ items }: { items: BreakingItem[] }) {
  if (!items.length) return null;
  const loop = [...items, ...items];

  return (
    <div className="flex items-stretch overflow-hidden bg-ink text-ink-foreground">
      <div className="flex shrink-0 items-center gap-2 bg-accent px-4 py-2 text-sm font-bold text-accent-foreground">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent-foreground" />
        عاجل
      </div>
      <div className="relative flex-1 overflow-hidden">
        <div className="ticker-track flex w-max items-center gap-10 whitespace-nowrap py-2 text-sm">
          {loop.map((item, i) => (
            <span key={`${item.id}-${i}`} className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {item.link ? (
                <a href={item.link} className="hover:underline">
                  {item.text}
                </a>
              ) : (
                <Link to="/" className="hover:underline">
                  {item.text}
                </Link>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}