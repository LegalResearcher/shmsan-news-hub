import { useState } from "react";
import { Minus, TrendingDown, TrendingUp, Clock } from "lucide-react";

type City = "aden" | "sanaa";

type CurrencyRow = { code: string; label: string; buy: string; sell: string };
type GoldRow = { code: string; label: string; value: string; trend: string };

// أسعار صرف العملات (شراء/بيع) - مصدر: ye-rial.com بتاريخ اليوم
const currencyRows: Record<City, CurrencyRow[]> = {
  aden: [
    { code: "USD", label: "دولار أمريكي", buy: "1,554", sell: "1,562" },
    { code: "SAR", label: "ريال سعودي", buy: "410", sell: "413" },
  ],
  sanaa: [
    { code: "USD", label: "دولار أمريكي", buy: "531", sell: "533" },
    { code: "SAR", label: "ريال سعودي", buy: "139.8", sell: "140.2" },
  ],
};

// أسعار الذهب حسب المدينة (بيع) - مصدر: boqash.com/prices-gold بتاريخ 2026-08-10
const goldRows: Record<City, GoldRow[]> = {
  aden: [
    { code: "21K", label: "الذهب عيار 21", value: "202,900", trend: "+1.0%" },
    { code: "جنيه", label: "جنيه ذهب", value: "1,537,500", trend: "0.0%" },
  ],
  sanaa: [
    { code: "21K", label: "الذهب عيار 21", value: "66,500", trend: "-2.9%" },
    { code: "جنيه", label: "جنيه ذهب", value: "522,000", trend: "+0.4%" },
  ],
};

const cityTabs: { id: City; label: string }[] = [
  { id: "aden", label: "عدن" },
  { id: "sanaa", label: "صنعاء" },
];

function trendIcon(trend: string) {
  if (trend.startsWith("+")) return <TrendingUp className="h-3 w-3" />;
  if (trend.startsWith("-")) return <TrendingDown className="h-3 w-3" />;
  return <Minus className="h-3 w-3" />;
}

function trendClass(trend: string) {
  if (trend.startsWith("+")) return "bg-emerald-50 text-emerald-600";
  if (trend.startsWith("-")) return "bg-accent/10 text-accent";
  return "bg-surface text-muted-foreground";
}

function CurrencyRateRow({ row }: { row: CurrencyRow }) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
      <div className="flex items-center gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface text-[10px] font-extrabold text-muted-foreground">
          {row.code}
        </span>
        <span className="font-semibold">{row.label}</span>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <span className="flex flex-col items-end">
          <span className="text-muted-foreground">شراء</span>
          <span className="font-mono font-bold tabular-nums text-foreground">{row.buy}</span>
        </span>
        <span className="flex flex-col items-end">
          <span className="text-muted-foreground">بيع</span>
          <span className="font-mono font-bold tabular-nums text-foreground">{row.sell}</span>
        </span>
      </div>
    </li>
  );
}

function GoldRateRow({ row }: { row: GoldRow }) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
      <div className="flex items-center gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface text-[10px] font-extrabold text-muted-foreground">
          {row.code}
        </span>
        <span className="font-semibold">{row.label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm font-bold tabular-nums">
          {row.value}
          <span className="ms-1 text-xs font-normal text-muted-foreground">ريال</span>
        </span>
        <span
          className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-bold tabular-nums ${trendClass(row.trend)}`}
        >
          {trendIcon(row.trend)}
          {row.trend}
        </span>
      </div>
    </li>
  );
}

export function MarketWidget() {
  const [city, setCity] = useState<City>("aden");

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <header className="flex items-center justify-between border-b border-border bg-surface/50 px-4 py-3">
        <div>
          <h2 className="text-sm font-extrabold">أسعار العملات والذهب</h2>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            تحديث إرشادي يومي
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

      <ul className="divide-y divide-border">
        {currencyRows[city].map((row) => (
          <CurrencyRateRow key={row.code} row={row} />
        ))}
      </ul>

      <div className="border-t-4 border-double border-border">
        <p className="px-4 pt-2 text-[11px] font-bold text-muted-foreground">
          أسعار الذهب — {city === "aden" ? "عدن" : "صنعاء"}
        </p>
        <ul className="divide-y divide-border">
          {goldRows[city].map((row) => (
            <GoldRateRow key={row.code} row={row} />
          ))}
        </ul>
      </div>
    </section>
  );
}
