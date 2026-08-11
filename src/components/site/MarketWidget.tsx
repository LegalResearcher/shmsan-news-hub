import { useState } from "react";
import { Minus, TrendingDown, TrendingUp, Clock } from "lucide-react";

type City = "aden" | "sanaa";

export type MarketRateRow = {
  city: City;
  kind: "currency" | "gold";
  code: string;
  label: string;
  buy: number | null;
  sell: number;
  prev_sell: number | null;
  updated_at: string;
};

const cityTabs: { id: City; label: string }[] = [
  { id: "aden", label: "عدن" },
  { id: "sanaa", label: "صنعاء" },
];

function formatNumber(n: number): string {
  return n.toLocaleString("ar", { maximumFractionDigits: 2 });
}

function trendPercent(row: MarketRateRow): string | null {
  if (row.prev_sell == null || row.prev_sell === 0) return null;
  const pct = ((row.sell - row.prev_sell) / row.prev_sell) * 100;
  const sign = pct > 0 ? "+" : pct < 0 ? "" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

function trendIcon(trend: string | null) {
  if (!trend) return <Minus className="h-3 w-3" />;
  if (trend.startsWith("+")) return <TrendingUp className="h-3 w-3" />;
  if (trend.startsWith("-")) return <TrendingDown className="h-3 w-3" />;
  return <Minus className="h-3 w-3" />;
}

function trendClass(trend: string | null) {
  if (!trend) return "bg-surface text-muted-foreground";
  if (trend.startsWith("+")) return "bg-emerald-50 text-emerald-600";
  if (trend.startsWith("-")) return "bg-accent/10 text-accent";
  return "bg-surface text-muted-foreground";
}

function CurrencyRateRow({ row }: { row: MarketRateRow }) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
      <div className="flex items-center gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface text-[10px] font-extrabold text-muted-foreground">
          {row.code}
        </span>
        <span className="font-semibold">{row.label}</span>
      </div>
      <div className="flex items-center gap-3 text-xs">
        {row.buy != null ? (
          <span className="flex flex-col items-end">
            <span className="text-muted-foreground">شراء</span>
            <span className="font-mono font-bold tabular-nums text-foreground">
              {formatNumber(row.buy)}
            </span>
          </span>
        ) : null}
        <span className="flex flex-col items-end">
          <span className="text-muted-foreground">بيع</span>
          <span className="font-mono font-bold tabular-nums text-foreground">
            {formatNumber(row.sell)}
          </span>
        </span>
      </div>
    </li>
  );
}

function GoldRateRow({ row }: { row: MarketRateRow }) {
  const trend = trendPercent(row);
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
      <div className="flex items-center gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface text-[10px] font-extrabold text-muted-foreground">
          {row.code === "GOLD21" ? "21K" : "جنيه"}
        </span>
        <span className="font-semibold">{row.label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm font-bold tabular-nums">
          {formatNumber(row.sell)}
          <span className="ms-1 text-xs font-normal text-muted-foreground">ريال</span>
        </span>
        {trend ? (
          <span
            className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-bold tabular-nums ${trendClass(trend)}`}
          >
            {trendIcon(trend)}
            {trend}
          </span>
        ) : null}
      </div>
    </li>
  );
}

export function MarketWidget({ rates }: { rates: MarketRateRow[] }) {
  const [city, setCity] = useState<City>("aden");

  if (!rates.length) return null; // لا نعرض الودجت أبداً ببيانات وهمية لو الجدول فارغ

  const cityRates = rates.filter((r) => r.city === city);
  const currencies = cityRates.filter((r) => r.kind === "currency");
  const gold = cityRates.filter((r) => r.kind === "gold");
  const lastUpdated = cityRates[0]?.updated_at;

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <header className="flex items-center justify-between border-b border-border bg-surface/50 px-4 py-3">
        <div>
          <h2 className="text-sm font-extrabold">أسعار العملات والذهب</h2>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {lastUpdated
              ? `آخر تحديث: ${new Date(lastUpdated).toLocaleString("ar", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : "تحديث إرشادي"}
          </p>
        </div>
      </header>

      <div className="flex gap-1 border-b border-border bg-surface/30 p-1">
        {cityTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setCity(tab.id)}
            className={`flex-1 rounded px-4 py-1.5 text-sm font-bold transition-colors ${
              city === tab.id
                ? "bg-accent text-accent-foreground shadow-sm"
                : "text-muted-foreground hover:bg-surface hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {currencies.length ? (
        <ul className="divide-y divide-border">
          {currencies.map((row) => (
            <CurrencyRateRow key={row.code} row={row} />
          ))}
        </ul>
      ) : null}

      {gold.length ? (
        <div className="border-t-4 border-double border-border">
          <p className="px-4 pt-2 text-[11px] font-bold text-muted-foreground">
            أسعار الذهب — {city === "aden" ? "عدن" : "صنعاء"}
          </p>
          <ul className="divide-y divide-border">
            {gold.map((row) => (
              <GoldRateRow key={row.code} row={row} />
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
