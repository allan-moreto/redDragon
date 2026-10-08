"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { recordPurchase, recordSale } from "@/lib/actions";
import { formatMoney } from "@/lib/inventory";
import type { ProductDTO } from "@/lib/types";
import { Button, controlClass, Field, Notice } from "@/components/ui";

export function MovementForm({
  kind,
  products,
  initialProductId,
  onSuccess,
  onSwitch,
}: {
  kind: "purchase" | "sale";
  products: ProductDTO[];
  initialProductId?: string;
  onSuccess: (message: string) => void;
  onSwitch?: (kind: "purchase" | "sale") => void;
}) {
  const action = kind === "purchase" ? recordPurchase : recordSale;
  const [state, formAction, pending] = useActionState(action, null);
  const [productId, setProductId] = useState(initialProductId ?? products[0]?.id ?? "");
  const product = products.find((item) => item.id === productId);
  const defaultUnit = product ? (kind === "purchase" ? product.costPrice : product.sellingPrice) : 0;
  const [unit, setUnit] = useState(String(defaultUnit));
  const [quantity, setQuantity] = useState("1");

  useEffect(() => {
    if (state?.ok) onSuccess(state.message);
  }, [state, onSuccess]);

  function chooseProduct(id: string) {
    setProductId(id);
    const next = products.find((item) => item.id === id);
    if (!next) return;
    setUnit(String(kind === "purchase" ? next.costPrice : next.sellingPrice));
  }

  const categories = useMemo(
    () => [...new Set(products.map((item) => item.category))].sort((a, b) => a.localeCompare(b)),
    [products],
  );

  const quantityNumber = Number(quantity);
  const unitNumber = Number(unit);
  const total = Number.isFinite(quantityNumber) && Number.isFinite(unitNumber) ? quantityNumber * unitNumber : 0;
  const blocked =
    kind === "sale" &&
    product !== undefined &&
    (product.currentStock <= 0 || (Number.isInteger(quantityNumber) && quantityNumber > product.currentStock));

  return (
    <form action={formAction} className="space-y-4">
      {state && !state.ok ? <Notice ok={false} message={state.message} /> : null}
      {kind === "sale" && product && product.currentStock <= 0 ? (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-900 dark:bg-red-950 dark:text-red-100">
          <p>{product.name} is out of stock. Record a purchase before you sell it.</p>
          {onSwitch ? (
            <button type="button" className="mt-2 font-semibold underline" onClick={() => onSwitch("purchase")}>
              Record a purchase instead
            </button>
          ) : null}
        </div>
      ) : null}
      <Field label="Product">
        <select
          className={controlClass}
          name="productId"
          required
          value={productId}
          onChange={(event) => chooseProduct(event.target.value)}
        >
          {products.length === 0 ? <option value="">Add a product first</option> : null}
          {categories.map((category) => (
            <optgroup key={category} label={category}>
              {products
                .filter((item) => item.category === category)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.currentStock} on hand)
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={kind === "purchase" ? "How many did you buy?" : "How many did you sell?"}>
          <input
            className={controlClass}
            name="quantity"
            type="number"
            required
            min={1}
            max={kind === "sale" && product ? Math.max(product.currentStock, 1) : undefined}
            step={1}
            inputMode="numeric"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            onWheel={(event) => event.currentTarget.blur()}
          />
        </Field>
        <Field
          label={kind === "purchase" ? "Cost each" : "Price each"}
          hint={kind === "sale" ? "This sale only. The usual price stays the same." : "You can use a different cost than usual."}
        >
          <input
            className={controlClass}
            name={kind === "purchase" ? "unitCost" : "unitPrice"}
            type="number"
            required
            min={0}
            step="0.01"
            inputMode="decimal"
            value={unit}
            onChange={(event) => setUnit(event.target.value)}
            onWheel={(event) => event.currentTarget.blur()}
          />
        </Field>
      </div>
      <Field label="Note" hint="Optional. Something you'll recognize later.">
        <input className={controlClass} name="note" maxLength={200} placeholder={kind === "purchase" ? "Weekly restock" : "Counter sale"} />
      </Field>
      {kind === "purchase" ? (
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="updateCost" defaultChecked className="mt-1" />
          <span>Use this cost as the new cost price for this product.</span>
        </label>
      ) : null}
      {product && Number.isFinite(total) ? (
        <p className="text-sm text-muted">
          {kind === "purchase" ? "This purchase costs " : "This sale brings in "}
          <span className="font-semibold text-foreground">{formatMoney(total)}</span>
          {kind === "purchase"
            ? `. You'll have ${product.currentStock + (Number.isInteger(quantityNumber) ? quantityNumber : 0)} on hand.`
            : product.currentStock > 0
              ? `. You'll have ${Math.max(product.currentStock - (Number.isInteger(quantityNumber) ? quantityNumber : 0), 0)} left.`
              : "."}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending || products.length === 0 || blocked}>
          {pending ? "Saving..." : kind === "purchase" ? "Record purchase" : "Record sale"}
        </Button>
      </div>
    </form>
  );
}
