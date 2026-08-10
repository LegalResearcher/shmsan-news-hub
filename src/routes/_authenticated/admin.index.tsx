import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Eye, FolderTree, Newspaper, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatArabicDate } from "@/lib/news.types";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const { data } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      const [posts, categories, authors, latest, top] = await Promise.all([
        supabase.from("posts").select("id,views", { count: "exact" }),
        supabase.from("categories").select("id", { count: "exact", head: true }),
        supabase.from("authors").select("id", { count: "exact", head: true }),
        supabase
          .from("posts")
          .select("id,title,status,published_at")
          .order("created_at", { ascending: false })
          .limit(6),
        supabase
          .from("posts")
          .select("id,title,views")
          .order("views", { ascending: false })
          .limit(6),
      ]);
      const views = (posts.data ?? []).reduce((sum, p) => sum + (p.views ?? 0), 0);
      return {
        postsCount: posts.count ?? 0,
        categoriesCount: categories.count ?? 0,
        authorsCount: authors.count ?? 0,
        views,
        latest: latest.data ?? [],
        top: top.data ?? [],
      };
    },
  });

  const stats = [
    { label: "إجمالي الأخبار", value: data?.postsCount ?? 0, icon: Newspaper },
    { label: "الأقسام", value: data?.categoriesCount ?? 0, icon: FolderTree },
    { label: "الكتّاب", value: data?.authorsCount ?? 0, icon: Users },
    { label: "إجمالي المشاهدات", value: data?.views ?? 0, icon: Eye },
  ];

  const statusLabel: Record<string, string> = {
    draft: "مسودة",
    published: "منشور",
    scheduled: "مجدول",
  };

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-extrabold">لوحة التحكم</h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <stat.icon className="h-4 w-4 text-accent" />
            </div>
            <p className="mt-2 font-display text-2xl font-black">
              {stat.value.toLocaleString("ar")}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card">
          <header className="border-b border-border px-4 py-3 text-sm font-extrabold">
            أحدث الأخبار
          </header>
          <ul className="divide-y divide-border">
            {(data?.latest ?? []).map((post) => (
              <li key={post.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <Link
                  to="/admin/posts/$id"
                  params={{ id: post.id }}
                  className="min-w-0 flex-1 truncate text-sm font-semibold hover:text-accent"
                >
                  {post.title}
                </Link>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {statusLabel[post.status] ?? post.status} · {formatArabicDate(post.published_at)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-border bg-card">
          <header className="border-b border-border px-4 py-3 text-sm font-extrabold">
            الأكثر مشاهدة
          </header>
          <ul className="divide-y divide-border">
            {(data?.top ?? []).map((post) => (
              <li key={post.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{post.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {(post.views ?? 0).toLocaleString("ar")} مشاهدة
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
