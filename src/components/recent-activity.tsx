import Link from "next/link";
import { formatMoney, formatWhen, TYPE_LABEL } from "@/lib/inventory";
import type { LedgerEntry } from "@/lib/types";

export function RecentActivity({ entries }: { entries: LedgerEntry[] }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Latest activity</h2>
        <Link href="/activity" className="text-sm font-semibold text-accent">
          See all activity
        </Link>
      </div>
      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Purchases and sales will show up here.</p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {entries.map((entry) => (
            <li key={entry.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">
                  {TYPE_LABEL[entry.type]} · {entry.productName}
                </p>
                <p className="text-sm text-muted">{formatWhen(entry.occurredAt)}</p>
              </div>
              <p className="text-sm">
                <span className={entry.signedQuantity < 0 ? "font-semibold text-danger" : "font-semibold text-accent"}>
                  {entry.signedQuantity > 0 ? "+" : ""}
                  {entry.signedQuantity}
                </span>
                {entry.type === "ADJUSTMENT" ? null : <span className="text-muted"> · {formatMoney(entry.totalAmount)}</span>}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
