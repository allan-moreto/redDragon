"use client";

import { useCallback, useMemo, useState } from "react";
import { formatMoney, formatNumber, formatWhen, SOURCE_LABEL, TYPE_LABEL } from "@/lib/inventory";
import type { LedgerEntry, ProductDTO } from "@/lib/types";
import { Modal } from "@/components/modal";
import { MovementForm } from "@/components/movement-form";
import { Button, controlClass, Notice } from "@/components/ui";

export function ActivityPanel({
  products,
  entries,
}: {
  products: ProductDTO[];
  entries: LedgerEntry[];
}) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [dialog, setDialog] = useState<"none" | "purchase" | "sale">("none");
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null);

  const onSuccess = useCallback((message: string) => {
    setNotice({ ok: true, message });
    setDialog("none");
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return entries.filter((entry) => {
      const matchesType = type === "all" || entry.type === type;
      const matchesQuery =
        needle.length === 0 ||
        entry.productName.toLowerCase().includes(needle) ||
        entry.sku.toLowerCase().includes(needle) ||
        entry.note.toLowerCase().includes(needle);
      return matchesType && matchesQuery;
    });
  }, [entries, query, type]);

  return (
    <section className="space-y-4">
      {notice ? <Notice ok={notice.ok} message={notice.message} /> : null}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setDialog("purchase")}>Record purchase</Button>
        <Button variant="secondary" onClick={() => setDialog("sale")}>Record sale</Button>
      </div>
      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="grid gap-3 border-b border-border p-4 md:grid-cols-[minmax(0,1fr)_14rem]">
          <label>
            <span className="sr-only">Search activity</span>
            <input
              className={controlClass}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by product, SKU, or note"
            />
          </label>
          <label>
            <span className="sr-only">Activity type</span>
            <select className={controlClass} value={type} onChange={(event) => setType(event.target.value)}>
              <option value="all">All activity</option>
              <option value="PURCHASE">Purchases</option>
              <option value="SALE">Sales</option>
              <option value="ADJUSTMENT">Stock counts</option>
            </select>
          </label>
        </div>
        {visible.length === 0 ? (
          <p className="px-4 py-10 text-sm text-muted">
            {entries.length === 0
              ? "No stock changes yet. Record a purchase or a sale and it will show up here."
              : "Nothing matches that search."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">What happened</th>
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium">Change</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((entry) => (
                  <tr key={entry.id} className="border-t border-border align-top">
                    <td className="px-4 py-3 whitespace-nowrap">{formatWhen(entry.occurredAt)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{TYPE_LABEL[entry.type]}</p>
                      {entry.note ? <p className="text-muted">{entry.note}</p> : null}
                    </td>
                    <td className="px-4 py-3">
                      <p>{entry.productName}</p>
                      <p className="text-muted">{entry.sku}</p>
                    </td>
                    <td className={entry.signedQuantity < 0 ? "px-4 py-3 font-semibold text-danger" : "px-4 py-3 font-semibold text-accent"}>
                      {entry.signedQuantity > 0 ? "+" : ""}
                      {formatNumber(entry.signedQuantity)}
                    </td>
                    <td className="px-4 py-3">
                      {entry.type === "ADJUSTMENT" ? (
                        "—"
                      ) : (
                        <>
                          <p>{formatMoney(entry.totalAmount)}</p>
                          <p className="text-muted">{formatMoney(entry.unitAmount)} each</p>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={entry.source === "POS_SYNC" ? "font-semibold text-accent" : ""}>
                        {SOURCE_LABEL[entry.source]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Modal
        open={dialog !== "none"}
        title={dialog === "sale" ? "Record a sale" : "Record a purchase"}
        description={dialog === "sale" ? "Stock goes down. The sale is added to your totals." : "Stock goes up. The cost is added to your purchases."}
        onClose={() => setDialog("none")}
      >
        {dialog !== "none" ? (
          <MovementForm
            key={dialog}
            kind={dialog}
            products={products}
            onSuccess={onSuccess}
            onSwitch={setDialog}
          />
        ) : null}
      </Modal>
    </section>
  );
}
