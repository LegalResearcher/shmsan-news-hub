import type { AdRow } from "@/lib/news.types";

interface Props {
  placement: string;
  ads?: AdRow[];
  className?: string;
  label?: string;
}

export function AdSlot({ placement, ads = [], className, label = "مساحة إعلانية" }: Props) {
  const ad = ads.find((a) => a.placement === placement);

  if (ad?.image_url) {
    const img = (
      <img src={ad.image_url} alt={ad.name} loading="lazy" className="w-full rounded object-cover" />
    );
    return (
      <div className={className}>
        {ad.link_url ? (
          <a href={ad.link_url} target="_blank" rel="noopener noreferrer">
            {img}
          </a>
        ) : (
          img
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex min-h-24 items-center justify-center rounded border border-dashed border-border bg-surface text-xs text-muted-foreground ${className ?? ""}`}
    >
      {label}
    </div>
  );
}