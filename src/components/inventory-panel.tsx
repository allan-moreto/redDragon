"use client";

import { Search } from "lucide-react";
import { useActionState, useCallback, useEffect, useMemo, useState } from "react";
import { deleteProduct } from "@/lib/actions";
import { formatMoney, formatNumber, STATUS_LABEL } from "@/lib/inventory";
import type { ProductDTO } from "@/lib/types";
import { Modal } from "@/components/modal";
import { MovementForm } from "@/components/movement-form";
import { ProductForm } from "@/components/product-form";
import { StatusPill } from "@/components/status-pill";
import { Button, controlClass, Notice } from "@/components/ui";

type DialogState =
  | { type: "none" }
  | { type: "create" }
  | { type: "edit"; product: ProductDTO }
  | { type: "purchase" | "sale"; productId?: string }
  | { type: "delete"; product: ProductDTO };

const rank = { out: 0, low: 1, in: 2 };

export function InventoryPanel({ products }: { products: ProductDTO[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [dialog, setDialog] = useState<DialogState>({ type: "none" });
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null);

  const onSuccess = useCallback((message: string) => {
    setNotice({ ok: true, message });
    setDialog({ type: "none" });
  }, []);

  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category))].sort((a, b) => a.localeCompare(b)),
    [products],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return [...products]
      .sort((a, b) => rank[a.status] - rank[b.status] || a.name.localeCompare(b.name))
      .filter((product) => {
        const matchesQuery =
          needle.length === 0 ||
          product.name.toLowerCase().includes(needle) ||
          product.sku.toLowerCase().includes(needle) ||
          product.category.toLowerCase().includes(needle);
        const matchesCategory = category === "all" || product.category === category;
        const matchesStatus = status === "all" || product.status === status;
        return matchesQuery && matchesCategory && matchesStatus;
      });
  }, [products, query, category, status]);

  const attention = products
    .filter((product) => product.status !== "in")
    .sort((a, b) => rank[a.status] - rank[b.status] || a.currentStock - b.currentStock);

  const close = () => setDialog({ type: "none" });

  return (
    <section className="space-y-4" id="inventory">
      {notice ? <Notice ok={notice.ok} message={notice.message} /> : null}
      {attention.length > 0 ? (
        <div id="attention" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
          <h2 className="font-semibold text-amber-950 dark:text-amber-50">
            {attention.length === 1 ? "1 item needs attention" : `${attention.length} items need attention`}
          </h2>
          <ul className="mt-3 space-y-2">
            {attention.slice(0, 6).map((product) => (
              <li key={product.id} className="flex flex-col gap-2 rounded-xl bg-white/70 px-3 py-2 sm:flex-row sm:items-center sm:justify-between dark:bg-black/20">
                <p className="text-sm text-amber-950 dark:text-amber-50">
                  <span className="font-semibold">{product.name}</span>
                  {product.status === "out"
                    ? " is out of stock."
                    : ` is low — ${formatNumber(product.currentStock)} left, reorder at ${formatNumber(product.reorderPoint)}.`}
                </p>
                <Button size="sm" variant="secondary" onClick={() => setDialog({ type: "purchase", productId: product.id })}>
                  Restock
                </Button>
              </li>
            ))}
          </ul>
          {attention.length > 6 ? (
            <p className="mt-2 text-sm text-amber-900 dark:text-amber-100">
              And {attention.length - 6} more in the list below.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Inventory</h2>
            <p className="text-sm text-muted">Items that need attention are listed first.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setDialog({ type: "purchase" })}>Record purchase</Button>
            <Button variant="secondary" onClick={() => setDialog({ type: "sale" })}>Record sale</Button>
            <Button data-testid="add-product" onClick={() => setDialog({ type: "create" })}>Add product</Button>
          </div>
        </div>
        <div className="grid gap-3 border-b border-border p-4 md:grid-cols-[minmax(0,1fr)_12rem_12rem]">
          <label className="relative block">
            <span className="sr-only">Search by name, SKU, or category</span>
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted" aria-hidden />
            <input
              data-testid="inventory-search"
              className={`${controlClass} pl-9`}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name or SKU"
            />
          </label>
          <label>
            <span className="sr-only">Category</span>
            <select className={controlClass} value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="all">All categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Stock status</span>
            <select className={controlClass} value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">All stock levels</option>
              <option value="in">{STATUS_LABEL.in}</option>
              <option value="low">{STATUS_LABEL.low}</option>
              <option value="out">{STATUS_LABEL.out}</option>
            </select>
          </label>
        </div>
        <p className="px-4 pt-3 text-sm text-muted">
          Showing {visible.length} of {products.length}
        </p>
        {products.length === 0 ? (
          <p className="px-4 py-10 text-sm text-muted">Your shelves are empty. Add a product to start tracking what you have.</p>
        ) : visible.length === 0 ? (
          <p className="px-4 py-10 text-sm text-muted">Nothing matches that search. Try another name, or set the filters back to all.</p>
        ) : (
          <>
            <div className="space-y-3 p-4 md:hidden">
              {visible.map((product) => (
                <article key={product.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-sm text-muted">{product.sku} · {product.category}</p>
                    </div>
                    <StatusPill status={product.status} />
                  </div>
                  <p className="mt-3 text-sm">
                    <span className="text-2xl font-semibold">{formatNumber(product.currentStock)}</span> on hand
                    <span className="text-muted"> · reorder at {formatNumber(product.reorderPoint)}</span>
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Cost {formatMoney(product.costPrice)} · Price {formatMoney(product.sellingPrice)}
                  </p>
                  <RowActions product={product} onDialog={setDialog} />
                </article>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">On hand</th>
                    <th className="px-4 py-3 font-medium">Reorder at</th>
                    <th className="px-4 py-3 font-medium">Cost</th>
                    <th className="px-4 py-3 font-medium">Price</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((product) => (
                    <tr key={product.id} className="border-t border-border">
                      <td className="px-4 py-3">
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-muted">{product.sku} · {product.category}</p>
                      </td>
                      <td className="px-4 py-3 text-base font-semibold">{formatNumber(product.currentStock)}</td>
                      <td className="px-4 py-3">{formatNumber(product.reorderPoint)}</td>
                      <td className="px-4 py-3">{formatMoney(product.costPrice)}</td>
                      <td className="px-4 py-3">{formatMoney(product.sellingPrice)}</td>
                      <td className="px-4 py-3"><StatusPill status={product.status} /></td>
                      <td className="px-4 py-3"><RowActions product={product} onDialog={setDialog} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <Modal
        open={dialog.type === "create" || dialog.type === "edit"}
        title={dialog.type === "edit" ? `Edit ${dialog.product.name}` : "Add a product"}
        description="Fill in what you pay, what you charge, and when to reorder."
        onClose={close}
      >
        {dialog.type === "create" || dialog.type === "edit" ? (
          <ProductForm
            key={dialog.type === "edit" ? dialog.product.id : "new"}
            product={dialog.type === "edit" ? dialog.product : undefined}
            categories={categories}
            onSuccess={onSuccess}
          />
        ) : null}
      </Modal>
      <Modal
        open={dialog.type === "purchase" || dialog.type === "sale"}
        title={dialog.type === "sale" ? "Record a sale" : "Record a purchase"}
        description={dialog.type === "sale" ? "This lowers the amount on hand and adds the money to today's sales." : "This raises the amount on hand and tracks what you spent."}
        onClose={close}
      >
        {dialog.type === "purchase" || dialog.type === "sale" ? (
          <MovementForm
            key={`${dialog.type}-${dialog.productId ?? "any"}`}
            kind={dialog.type}
            products={products}
            initialProductId={dialog.productId}
            onSuccess={onSuccess}
            onSwitch={(kind) => setDialog({ type: kind, productId: dialog.productId })}
          />
        ) : null}
      </Modal>
      <Modal
        open={dialog.type === "delete"}
        title={dialog.type === "delete" ? `Remove ${dialog.product.name}?` : "Remove product"}
        description="Its purchase and sales history will be deleted too. This can't be undone."
        onClose={close}
      >
        {dialog.type === "delete" ? (
          <DeleteForm product={dialog.product} onSuccess={onSuccess} onCancel={close} />
        ) : null}
      </Modal>
    </section>
  );
}

function DeleteForm({
  product,
  onSuccess,
  onCancel,
}: {
  product: ProductDTO;
  onSuccess: (message: string) => void;
  onCancel: () => void;
}) {
  const [state, action, pending] = useActionState(deleteProduct, null);

  useEffect(() => {
    if (state?.ok) onSuccess(state.message);
  }, [state, onSuccess]);

  return (
    <form action={action} className="space-y-4">
      {state && !state.ok ? <Notice ok={false} message={state.message} /> : null}
      <input type="hidden" name="id" value={product.id} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Keep it</Button>
        <Button type="submit" variant="danger" disabled={pending}>
          {pending ? "Removing..." : "Remove product"}
        </Button>
      </div>
    </form>
  );
}

function RowActions({
  product,
  onDialog,
}: {
  product: ProductDTO;
  onDialog: (dialog: DialogState) => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2 md:mt-0">
      <Button size="sm" variant="secondary" onClick={() => onDialog({ type: "purchase", productId: product.id })}>
        Restock
      </Button>
      <Button size="sm" variant="secondary" onClick={() => onDialog({ type: "sale", productId: product.id })}>
        Sell
      </Button>
      <Button size="sm" variant="ghost" onClick={() => onDialog({ type: "edit", product })}>
        Edit
      </Button>
      <Button size="sm" variant="ghost" onClick={() => onDialog({ type: "delete", product })}>
        Remove
      </Button>
    </div>
  );
}
