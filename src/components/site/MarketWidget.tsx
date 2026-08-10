const rows = [
  { label: "دولار أمريكي", value: "1 = 528 ريال", trend: "+0.4%" },
  { label: "ريال سعودي", value: "1 = 140 ريال", trend: "-0.2%" },
  { label: "يورو", value: "1 = 572 ريال", trend: "+0.6%" },
  { label: "الذهب عيار 21", value: "الغرام 42,300", trend: "+1.1%" },
  { label: "الذهب عيار 18", value: "الغرام 36,100", trend: "+0.9%" },
];

export function MarketWidget() {
  return (
    <section className="rounded border border-border bg-card">
      <header className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-extrabold">أسعار العملات والذهب</h2>
        <p className="mt-1 text-xs text-muted-foreground">تحديث إرشادي يومي</p>
      </header>
      <ul className="divide-y divide-border">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
            <span className="font-semibold">{row.label}</span>
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              {row.value}
              <span
                className={
                  row.trend.startsWith("+") ? "font-bold text-emerald-600" : "font-bold text-accent"
                }
              >
                {row.trend}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}