import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Search, X } from "lucide-react";
import type { CategoryRow } from "@/lib/news.types";

export function SiteHeader({ categories }: { categories: CategoryRow[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const main = categories.filter((c) => !c.parent_id);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    navigate({ to: "/search", search: { q: query.trim() } });
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto grid max-w-6xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded bg-accent font-display text-lg font-black text-accent-foreground">
            ش
          </span>
          <span className="font-display text-xl font-black leading-none">
            شمسان<span className="text-accent"> نيوز</span>
          </span>
        </Link>

        <form onSubmit={submit} className="hidden min-w-0 justify-self-end md:flex">
          <label className="flex w-64 items-center gap-2 rounded border border-border bg-surface px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث في الأخبار..."
              className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>
        </form>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="القائمة"
          className="shrink-0 justify-self-end rounded border border-border p-2 md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <nav className="hidden border-t border-border bg-ink md:block">
        <ul className="mx-auto flex max-w-6xl items-center gap-1 px-4">
          <li>
            <Link
              to="/"
              activeOptions={{ exact: true }}
              activeProps={{ className: "bg-accent text-accent-foreground" }}
              className="block px-3 py-3 text-sm font-bold text-ink-foreground transition-colors hover:bg-accent/80"
            >
              الرئيسية
            </Link>
          </li>
          {main.map((cat) => (
            <li key={cat.id}>
              <Link
                to="/category/$slug"
                params={{ slug: cat.slug }}
                activeProps={{ className: "bg-accent text-accent-foreground" }}
                className="block whitespace-nowrap px-3 py-3 text-sm font-bold text-ink-foreground transition-colors hover:bg-accent/80"
              >
                {cat.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {open ? (
        <div className="border-t border-border bg-card md:hidden">
          <form onSubmit={submit} className="border-b border-border p-4">
            <label className="flex items-center gap-2 rounded border border-border bg-surface px-3 py-2">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث في الأخبار..."
                className="w-full min-w-0 bg-transparent text-sm outline-none"
              />
            </label>
          </form>
          <ul className="p-2">
            <li>
              <Link
                to="/"
                onClick={() => setOpen(false)}
                className="block rounded px-3 py-2.5 text-sm font-bold hover:bg-surface"
              >
                الرئيسية
              </Link>
            </li>
            {main.map((cat) => (
              <li key={cat.id}>
                <Link
                  to="/category/$slug"
                  params={{ slug: cat.slug }}
                  onClick={() => setOpen(false)}
                  className="block rounded px-3 py-2.5 text-sm font-bold hover:bg-surface"
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </header>
  );
}