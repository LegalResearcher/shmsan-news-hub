import { Link } from "@tanstack/react-router";
import { articlePath, formatArabicDate, type PostSummary } from "@/lib/news.types";

interface Props {
  post: PostSummary;
  variant?: "default" | "compact" | "wide";
}

export function NewsCard({ post, variant = "default" }: Props) {
  const params = articlePath(post);

  if (variant === "compact") {
    return (
      <Link
        to="/$year/$month/$day/$slug"
        params={params}
        className="group flex items-start gap-3 border-b border-border pb-3 last:border-0"
      >
        {post.cover_image ? (
          <img
            src={post.cover_image}
            alt={post.title}
            loading="lazy"
            className="h-16 w-24 shrink-0 rounded object-cover"
          />
        ) : null}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold leading-6 transition-colors group-hover:text-accent">
            {post.title}
          </h3>
          <span className="mt-1 block text-xs text-muted-foreground">
            {formatArabicDate(post.published_at)}
          </span>
        </div>
      </Link>
    );
  }

  if (variant === "wide") {
    return (
      <Link
        to="/$year/$month/$day/$slug"
        params={params}
        className="group grid gap-4 border-b border-border pb-6 sm:grid-cols-[minmax(0,1fr)_240px]"
      >
        <div className="min-w-0">
          {post.category ? (
            <span className="text-xs font-bold text-accent">{post.category.name}</span>
          ) : null}
          <h3 className="mt-1 text-lg font-bold leading-8 transition-colors group-hover:text-accent">
            {post.title}
          </h3>
          {post.excerpt ? (
            <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted-foreground">{post.excerpt}</p>
          ) : null}
          <span className="mt-2 block text-xs text-muted-foreground">
            {formatArabicDate(post.published_at)}
          </span>
        </div>
        {post.cover_image ? (
          <img
            src={post.cover_image}
            alt={post.title}
            loading="lazy"
            className="aspect-[4/3] w-full rounded object-cover"
          />
        ) : null}
      </Link>
    );
  }

  return (
    <Link to="/$year/$month/$day/$slug" params={params} className="group block">
      {post.cover_image ? (
        <div className="overflow-hidden rounded">
          <img
            src={post.cover_image}
            alt={post.title}
            loading="lazy"
            className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      ) : null}
      <div className="pt-3">
        {post.category ? (
          <span className="text-xs font-bold text-accent">{post.category.name}</span>
        ) : null}
        <h3 className="mt-1 text-base font-bold leading-7 transition-colors group-hover:text-accent">
          {post.title}
        </h3>
        {post.excerpt ? (
          <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted-foreground">{post.excerpt}</p>
        ) : null}
        <span className="mt-2 block text-xs text-muted-foreground">
          {formatArabicDate(post.published_at)}
        </span>
      </div>
    </Link>
  );
}