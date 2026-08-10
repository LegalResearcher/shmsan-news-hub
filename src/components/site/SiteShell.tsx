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

export function SiteShell({ children, categories, breaking, showTicker = true }: Props) {
  const fetchNav = useServerFn(getNavigation);
  const { data } = useQuery({
    queryKey: ["navigation"],
    queryFn: () => fetchNav(),
    enabled: !categories,
    staleTime: 5 * 60 * 1000,
  });

  const cats = categories ?? data?.categories ?? [];
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