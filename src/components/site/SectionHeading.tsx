import { Link } from "@tanstack/react-router";

export function SectionHeading({ title, slug }: { title: string; slug?: string }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4 border-b-2 border-ink pb-2">
      <h2 className="relative text-xl font-extrabold">
        <span className="ms-0 inline-block border-b-4 border-accent pb-2">{title}</span>
      </h2>
      {slug ? (
        <Link
          to="/category/$slug"
          params={{ slug }}
          className="shrink-0 text-xs font-semibold text-muted-foreground transition-colors hover:text-accent"
        >
          المزيد ←
        </Link>
      ) : null}
    </div>
  );
}