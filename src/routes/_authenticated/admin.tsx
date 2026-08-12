import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  LayoutDashboard,
  Newspaper,
  FilePlus2,
  FolderTree,
  Users,
  Radio,
  Images,
  Tags,
  ShieldCheck,
  Megaphone,
  Wrench,
  Settings,
  UserCircle,
  Upload,
  LogOut,
  Menu,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useCurrentUser, useMyRoles } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const nav: { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { to: "/admin", label: "لوحة التحكم", icon: LayoutDashboard, exact: true },
  { to: "/admin/posts", label: "الأخبار", icon: Newspaper },
  { to: "/admin/posts/new", label: "محرر الأخبار", icon: FilePlus2 },
  { to: "/admin/categories", label: "الأقسام", icon: FolderTree },
  { to: "/admin/authors", label: "الكتّاب", icon: Users },
  { to: "/admin/breaking", label: "الأخبار العاجلة", icon: Radio },
  { to: "/admin/media", label: "الوسائط", icon: Images },
  { to: "/admin/tags", label: "الوسوم", icon: Tags },
  { to: "/admin/editors", label: "إدارة المحررين", icon: ShieldCheck },
  { to: "/admin/ads", label: "الإعلانات", icon: Megaphone },
  { to: "/admin/import", label: "استيراد JSON", icon: Upload },
  { to: "/admin/maintenance", label: "الصيانة والأرشفة", icon: Wrench },
  { to: "/admin/settings", label: "الإعدادات", icon: Settings },
  { to: "/admin/profile", label: "الملف الشخصي", icon: UserCircle },
];

function AdminLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const { data: roles } = useMyRoles();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const sidebar = (
    <nav className="flex h-full flex-col gap-1 overflow-y-auto p-3">
      {nav.map((item) => (
        <Link
          key={item.to}
          to={item.to as never}
          activeOptions={{ exact: item.exact ?? false }}
          activeProps={{ className: "bg-sidebar-primary text-sidebar-primary-foreground" }}
          onClick={() => setOpen(false)}
          className="flex items-center gap-2.5 rounded px-3 py-2.5 text-sm font-semibold text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span className="truncate">{item.label}</span>
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="hidden w-64 shrink-0 flex-col border-e border-sidebar-border bg-sidebar lg:flex">
        <div className="flex items-center gap-2 border-b border-sidebar-border px-4 py-4">
          <span className="grid h-9 w-9 place-items-center rounded bg-accent font-display font-black text-accent-foreground">
            ش
          </span>
          <span className="font-display text-base font-black text-sidebar-foreground">
            لوحة شمسان نيوز
          </span>
        </div>
        {sidebar}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-card px-4 py-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="القائمة"
            className="rounded border border-border p-2 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{user?.email}</p>
            <p className="text-xs text-muted-foreground">
              {roles?.includes("admin") ? "مدير" : roles?.includes("editor") ? "محرر" : "بدون صلاحية"}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button asChild variant="outline" size="sm">
              <a href="/" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" /> <span className="hidden sm:inline">الموقع</span>
              </a>
            </Button>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">خروج</span>
            </Button>
          </div>
        </header>

        {open ? (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <div className="fixed inset-y-0 start-0 z-50 w-72 max-w-[80vw] bg-sidebar shadow-xl lg:hidden">
              <div className="flex items-center gap-2 border-b border-sidebar-border px-4 py-4">
                <span className="grid h-9 w-9 place-items-center rounded bg-accent font-display font-black text-accent-foreground">
                  ش
                </span>
                <span className="font-display text-base font-black text-sidebar-foreground">
                  لوحة شمسان نيوز
                </span>
              </div>
              {sidebar}
            </div>
          </>
        ) : null}

        <main className="flex-1 overflow-x-hidden p-4 sm:p-6">
          {roles && roles.length === 0 ? (
            <div className="mb-6 rounded border border-accent/40 bg-accent/10 p-4 text-sm">
              حسابك غير مرتبط بصلاحية تحرير بعد. تواصل مع مدير النظام لمنحك دور «محرر» أو «مدير».
            </div>
          ) : null}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
