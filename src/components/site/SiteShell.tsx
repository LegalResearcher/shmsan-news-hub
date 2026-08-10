import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getNavigation } from "@/lib/news.functions";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { BreakingTicker } from "./BreakingTicker";
import type { BreakingItem, CategoryRow } from "@/lib/news.types";

interface Props {
  children: ReactNode;
  categories?: CategoryRow[];
  breaking?: BreakingItem[];
  showTicker?: boolean;
}

// إخفاء مؤقت لهذه الأقسام من كل قوائم الموقع (Header + Footer)
// لإعادة الإظهار: احذفي الاسم من هذه القائمة
const TEMP_HIDDEN_CATEGORIES = [
  "أخبار عدن",
  "أخبار محلية",
  "مقالات وآراء",
  "شمسان اليوم",
  "تاريخ وتراث",
  "تحت المجهر",
  "مختارات",
  "إضاءات عسكرية",
  "فيديو",
];

// الترتيب المطلوب للأقسام الظاهرة في كل قوائم الموقع (Header + Footer)
const CATEGORY_ORDER = [
  "أهم الأخبار",
  "أخبار وتقارير",
  "اليمن في الصحافة",
  "شؤون دولية",
  "آراء واتجاهات",
  "منوعات",
  "رياضة",
];

export function SiteShell({ children, categories, breaking, showTicker = true }: Props) {
  const fetchNav = useServerFn(getNavigation);
  const { data } = useQuery({
    queryKey: ["navigation"],
    queryFn: () => fetchNav(),
    enabled: !categories,
    staleTime: 5 * 60 * 1000,
  });

  const cats = (categories ?? data?.categories ?? [])
    .filter((c) => !TEMP_HIDDEN_CATEGORIES.includes(c.name))
    .sort((a, b) => {
      const ai = CATEGORY_ORDER.indexOf(a.name);
      const bi = CATEGORY_ORDER.indexOf(b.name);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  const items = breaking ?? data?.breaking ?? [];

  return (
    <div className="flex min-h-screen flex-col">
      {showTicker ? <BreakingTicker items={items} /> : null}
      <SiteHeader categories={cats} />
      <main className="flex-1">{children}</main>
      <SiteFooter categories={cats} />
    </div>
  );
}