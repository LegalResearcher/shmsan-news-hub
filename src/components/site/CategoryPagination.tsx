import { Link } from "@tanstack/react-router";

interface Props {
  slug: string;
  page: number;
  totalPages: number;
}

// يبني قائمة الصفحات المعروضة مع "..." عند الحاجة (يعرض 5 أرقام كحد أقصى حول الصفحة الحالية)
function buildPageList(current: number, total: number): (number | "gap")[] {
  const pages: (number | "gap")[] = [];
  const windowSize = 2;
  const start = Math.max(1, current - windowSize);
  const end = Math.min(total, current + windowSize);

  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push("gap");
  }
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < total) {
    if (end < total - 1) pages.push("gap");
    pages.push(total);
  }
  return pages;
}

export function CategoryPagination({ slug, page, totalPages }: Props) {
  if (totalPages <= 1) return null;
  const pages = buildPageList(page, totalPages);

  const linkTo = (p: number) => ({
    to: "/category/$slug" as const,
    params: { slug },
    search: { page: p },
  });

  return (
    <nav aria-label="pagination" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link
          {...linkTo(page - 1)}
          className="rounded border border-border px-4 py-2 text-sm font-bold transition-colors hover:border-accent hover:text-accent"
        >
          السابق
        </Link>
      ) : (
        <span className="cursor-not-allowed rounded border border-border px-4 py-2 text-sm font-bold text-muted-foreground opacity-40">
          السابق
        </span>
      )}

      {pages.map((p, i) =>
        p === "gap" ? (
          <span key={`gap-${i}`} className="px-2 text-sm text-muted-foreground">
            …
          </span>
        ) : (
          <Link
            key={p}
            {...linkTo(p)}
            aria-current={p === page ? "page" : undefined}
            className={
              p === page
                ? "rounded border border-accent bg-accent px-4 py-2 text-sm font-bold text-accent-foreground"
                : "rounded border border-border px-4 py-2 text-sm font-bold transition-colors hover:border-accent hover:text-accent"
            }
          >
            {p}
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link
          {...linkTo(page + 1)}
          className="rounded border border-border px-4 py-2 text-sm font-bold transition-colors hover:border-accent hover:text-accent"
        >
          التالي
        </Link>
      ) : (
        <span className="cursor-not-allowed rounded border border-border px-4 py-2 text-sm font-bold text-muted-foreground opacity-40">
          التالي
        </span>
      )}
    </nav>
  );
}
