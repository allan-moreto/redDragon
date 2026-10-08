"use client";

import { useActionState, useEffect, useState } from "react";
import { createProduct, updateProduct } from "@/lib/actions";
import { formatMoney } from "@/lib/inventory";
import type { ProductDTO } from "@/lib/types";
import { Button, controlClass, Field, Notice } from "@/components/ui";

const SUGGESTED = ["Bakery", "Drinks", "Household", "Pantry", "Snacks"];

export function ProductForm({
  product,
  categories,
  onSuccess,
}: {
  product?: ProductDTO;
  categories: string[];
  onSuccess: (message: string) => void;
}) {
  const [state, action, pending] = useActionState(product ? updateProduct : createProduct, null);
  const [cost, setCost] = useState(product ? String(product.costPrice) : "");
  const [price, setPrice] = useState(product ? String(product.sellingPrice) : "");

  useEffect(() => {
    if (state?.ok) onSuccess(state.message);
  }, [state, onSuccess]);

  const costNumber = Number(cost);
  const priceNumber = Number(price);
  const showMargin = cost.trim() !== "" && price.trim() !== "" && Number.isFinite(costNumber) && Number.isFinite(priceNumber);
  const margin = showMargin ? priceNumber - costNumber : 0;
  const options = [...new Set([...SUGGESTED, ...categories])].sort((a, b) => a.localeCompare(b));

  return (
    <form action={action} className="space-y-4">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      {state && !state.ok ? <Notice ok={false} message={state.message} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Product name" hint="The name you'll recognize on the shelf.">
          <input className={controlClass} name="name" required maxLength={80} defaultValue={product?.name} placeholder="Local Honey, 12 oz" />
        </Field>
        <Field label="SKU" hint="A short code. Saved in uppercase.">
          <input className={controlClass} name="sku" required maxLength={40} defaultValue={product?.sku} placeholder="HNY-001" autoComplete="off" />
        </Field>
        <Field label="Category" hint="Group similar items, like Drinks or Pantry.">
          <input className={controlClass} name="category" required maxLength={40} list="category-options" defaultValue={product?.category} placeholder="Pantry" />
          <datalist id="category-options">
            {options.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </Field>
        <Field
          label="On hand"
          hint={product ? "A change here is saved in Activity as a stock count." : "Enter what you already have, or start at zero."}
        >
          <input
            className={controlClass}
            name="currentStock"
            type="number"
            required
            min={0}
            step={1}
            inputMode="numeric"
            defaultValue={product?.currentStock ?? 0}
            onWheel={(event) => event.currentTarget.blur()}
          />
        </Field>
        <Field label="Reorder at" hint="We'll flag the item when stock is this number or lower.">
          <input
            className={controlClass}
            name="reorderPoint"
            type="number"
            required
            min={0}
            step={1}
            inputMode="numeric"
            defaultValue={product?.reorderPoint ?? 0}
            onWheel={(event) => event.currentTarget.blur()}
          />
        </Field>
        <Field label="Cost price" hint="What you pay for one.">
          <input
            className={controlClass}
            name="costPrice"
            type="number"
            required
            min={0}
            step="0.01"
            inputMode="decimal"
            value={cost}
            onChange={(event) => setCost(event.target.value)}
            onWheel={(event) => event.currentTarget.blur()}
          />
        </Field>
        <Field label="Selling price" hint="What a customer pays for one.">
          <input
            className={controlClass}
            name="sellingPrice"
            type="number"
            required
            min={0}
            step="0.01"
            inputMode="decimal"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            onWheel={(event) => event.currentTarget.blur()}
          />
        </Field>
      </div>
      {showMargin ? (
        <p className="text-sm text-muted">
          {margin >= 0
            ? `You make ${formatMoney(margin)} on each sale.`
            : `The selling price is ${formatMoney(Math.abs(margin))} below your cost. That's fine if you mean to discount it.`}
        </p>
      ) : null}
      <div className="flex justify-end gap-2 pt-1">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : product ? "Save changes" : "Add product"}
        </Button>
      </div>
    </form>
  );
}
