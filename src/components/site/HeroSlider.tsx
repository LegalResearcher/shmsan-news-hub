import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { articlePath, formatArabicDate, type PostSummary } from "@/lib/news.types";

export function HeroSlider({ posts }: { posts: PostSummary[] }) {
  const slides = posts.slice(0, 5);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(id);
  }, [slides.length]);

  if (!slides.length) return null;
  const active = slides[index]!;

  return (
    <section className="relative overflow-hidden rounded bg-ink">
      <Link to="/$year/$month/$day/$slug" params={articlePath(active)} className="group block">
        <div className="relative aspect-[16/10] w-full sm:aspect-[16/8]">
          {active.cover_image ? (
            <img
              src={active.cover_image}
              alt={active.title}
              className="h-full w-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
            {active.category ? (
              <span className="inline-block rounded bg-accent px-2.5 py-1 text-xs font-bold text-accent-foreground">
                {active.category.name}
              </span>
            ) : null}
            <h2 className="mt-3 max-w-3xl text-xl font-extrabold leading-9 text-ink-foreground sm:text-3xl sm:leading-[3rem]">
              {active.title}
            </h2>
            <p className="mt-2 text-xs text-ink-foreground/70">
              {formatArabicDate(active.published_at)}
            </p>
          </div>
        </div>
      </Link>

      {slides.length > 1 ? (
        <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center justify-between px-3">
          <button
            type="button"
            aria-label="السابق"
            onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
            className="grid h-9 w-9 place-items-center rounded-full bg-ink/60 text-ink-foreground transition-colors hover:bg-accent"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="التالي"
            onClick={() => setIndex((i) => (i + 1) % slides.length)}
            className="grid h-9 w-9 place-items-center rounded-full bg-ink/60 text-ink-foreground transition-colors hover:bg-accent"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>
      ) : null}

      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            aria-label={`الشريحة ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-accent" : "w-2 bg-ink-foreground/50"}`}
          />
        ))}
      </div>
    </section>
  );
}