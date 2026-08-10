import { Link } from "@tanstack/react-router";
import { articlePath, type PostSummary } from "@/lib/news.types";

export function MostRead({ posts, limit = 6 }: { posts: PostSummary[]; limit?: number }) {
  const items = posts.slice(0, limit);
  if (!items.length) return null;

  return (
    <section className="rounded border border-border bg-card">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-extrabold">الأكثر قراءة</h2>
        <Link to="/most-read" className="text-xs text-muted-foreground hover:text-accent">
          الكل
        </Link>
      </header>
      <ol className="divide-y divide-border">
        {items.map((post, index) => (
          <li key={post.id}>
            <Link
              to="/$year/$month/$day/$slug"
              params={articlePath(post)}
              className="group flex gap-3 px-4 py-3"
            >
              <span className="font-display text-lg font-extrabold text-accent/70">{index + 1}</span>
              <span className="text-sm font-semibold leading-6 transition-colors group-hover:text-accent">
                {post.title}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}