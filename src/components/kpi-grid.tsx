import { AlertTriangle, CircleDollarSign, ShoppingBag, Truck } from "lucide-react";
import { formatMoney } from "@/lib/inventory";
import type { Kpis } from "@/lib/types";

export function KpiGrid({ kpis }: { kpis: Kpis }) {
  const cards = [
    {
      id: "kpi-stock-value",
      label: "Total stock value",
      value: formatMoney(kpis.stockValue),
      detail: "What the items on your shelves cost you",
      icon: CircleDollarSign,
      href: undefined,
    },
    {
      id: "kpi-sales",
      label: "Sales today",
      value: formatMoney(kpis.salesToday),
      detail: `${formatMoney(kpis.salesMonth)} this month`,
      icon: ShoppingBag,
      href: "/activity",
    },
    {
      id: "kpi-low-stock",
      label: "Low stock alerts",
      value: String(kpis.lowStockCount),
      detail: kpis.lowStockCount === 0 ? "Everything is above its reorder point" : "At or below the reorder point",
      icon: AlertTriangle,
      href: kpis.lowStockCount > 0 ? "#attention" : undefined,
    },
    {
      id: "kpi-purchases",
      label: "Purchases this month",
      value: formatMoney(kpis.purchasesMonth),
      detail: `${formatMoney(kpis.purchasesAll)} all time`,
      icon: Truck,
      href: "/activity",
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Summary">
      {cards.map((card) => {
        const Icon = card.icon;
        const body = (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-muted">{card.label}</p>
              <Icon className="h-4 w-4 text-accent" aria-hidden />
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight">{card.value}</p>
            <p className="mt-1 text-sm text-muted">{card.detail}</p>
          </>
        );
        const className = "rounded-2xl border border-border bg-card p-4 shadow-sm";
        return card.href ? (
          <a key={card.id} id={card.id} href={card.href} className={className}>
            {body}
          </a>
        ) : (
          <article key={card.id} id={card.id} className={className}>
            {body}
          </article>
        );
      })}
    </section>
  );
}
