import { useState } from "react";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";

type City = "aden" | "sanaa";

type Row = { code: string; label: string; value: string; trend: string };

const currencyRows: Record<City, Row[]> = {
  aden: [
    { code: "USD", label: "دولار أمريكي", value: "1,580", trend: "+0.5%" },
    { code: "SAR", label: "ريال سعودي", value: "415", trend: "+0.3%" },
    { code: "EUR", label: "يورو", value: "1,710", trend: "+0.4%" },
  ],
  sanaa: [
    { code: "USD", label: "دولار أمريكي", value: "533", trend: "+0.1%" },
    { code: "SAR", label: "ريال سعودي", value: "140", trend: "-0.2%" },
    { code: "EUR", label: "يورو", value: "572", trend: "+0.2%" },
  ],
};

const goldRows: Row[] = [
  { code: "21K", label: "الذهب عيار 21", value: "42,300", trend: "+1.1%" },
  { code: "18K", label: "الذهب عيار 18", value: "36,100", trend: "+0.9%" },
];

const cityTabs: { id: City; label: string }[] = [
  { id: "aden", label: "عدن" },
  { id: "sanaa", label: "صنعاء" },
];

function RateRow({ row, unit }: { row: Row; unit: string }) {
  const isUp = row.trend.startsWith("+");
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
          <span className="ms-1 text-xs font-normal text-muted-foreground">{unit}</span>
        </span>
        <span
          className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-bold tabular-nums ${
            isUp ? "bg-emerald-50 text-emerald-600" : "bg-accent/10 text-accent"
          }`}
        >
          {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
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
          <RateRow key={row.code} row={row} unit="ريال" />
        ))}
      </ul>

      <div className="border-t-4 border-double border-border">
        <p className="px-4 pt-2 text-[11px] font-bold text-muted-foreground">أسعار الذهب</p>
        <ul className="divide-y divide-border">
          {goldRows.map((row) => (
            <RateRow key={row.code} row={row} unit="ريال / غرام" />
          ))}
        </ul>
      </div>
    </section>
  );
}
