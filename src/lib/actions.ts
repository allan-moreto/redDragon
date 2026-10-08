"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { numberField, skuField, textField } from "@/lib/form";
import { roundMoney } from "@/lib/inventory";
import type { ActionState } from "@/lib/types";
import { syncPosPayload, PosSyncError } from "@/services/posSync";

function refresh() {
  revalidatePath("/", "layout");
}

function saved(message: string): ActionState {
  refresh();
  return { ok: true, message };
}

export async function createProduct(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const sku = skuField(formData);
  if (!sku.ok) return sku;
  const name = textField(formData, "name", { label: "a product name", max: 80 });
  if (!name.ok) return name;
  const category = textField(formData, "category", { label: "a category", max: 40 });
  if (!category.ok) return category;
  const currentStock = numberField(formData, "currentStock", {
    label: "how many you have",
    min: 0,
    max: 1_000_000,
    integer: true,
  });
  if (!currentStock.ok) return currentStock;
  const reorderPoint = numberField(formData, "reorderPoint", {
    label: "the low-stock number",
    min: 0,
    max: 1_000_000,
    integer: true,
  });
  if (!reorderPoint.ok) return reorderPoint;
  const costPrice = numberField(formData, "costPrice", {
    label: "the cost price",
    min: 0,
    max: 1_000_000,
    money: true,
  });
  if (!costPrice.ok) return costPrice;
  const sellingPrice = numberField(formData, "sellingPrice", {
    label: "the selling price",
    min: 0,
    max: 1_000_000,
    money: true,
  });
  if (!sellingPrice.ok) return sellingPrice;

  try {
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          sku: sku.value,
          name: name.value,
          category: category.value,
          currentStock: currentStock.value,
          reorderPoint: reorderPoint.value,
          costPrice: costPrice.value,
          sellingPrice: sellingPrice.value,
        },
      });
      if (currentStock.value > 0) {
        await tx.transaction.create({
          data: {
            productId: product.id,
            type: "ADJUSTMENT",
            quantity: currentStock.value,
            signedQuantity: currentStock.value,
            unitAmount: 0,
            totalAmount: 0,
            source: "MANUAL",
            note: "Starting stock",
          },
        });
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, message: `SKU ${sku.value} is already used by another product.` };
    }
    throw error;
  }

  return saved(`${name.value} is now in your inventory.`);
}

export async function updateProduct(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = textField(formData, "id", { label: "the product", max: 80 });
  if (!id.ok) return id;
  const sku = skuField(formData);
  if (!sku.ok) return sku;
  const name = textField(formData, "name", { label: "a product name", max: 80 });
  if (!name.ok) return name;
  const category = textField(formData, "category", { label: "a category", max: 40 });
  if (!category.ok) return category;
  const currentStock = numberField(formData, "currentStock", {
    label: "how many you have",
    min: 0,
    max: 1_000_000,
    integer: true,
  });
  if (!currentStock.ok) return currentStock;
  const reorderPoint = numberField(formData, "reorderPoint", {
    label: "the low-stock number",
    min: 0,
    max: 1_000_000,
    integer: true,
  });
  if (!reorderPoint.ok) return reorderPoint;
  const costPrice = numberField(formData, "costPrice", {
    label: "the cost price",
    min: 0,
    max: 1_000_000,
    money: true,
  });
  if (!costPrice.ok) return costPrice;
  const sellingPrice = numberField(formData, "sellingPrice", {
    label: "the selling price",
    min: 0,
    max: 1_000_000,
    money: true,
  });
  if (!sellingPrice.ok) return sellingPrice;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.product.findUnique({ where: { id: id.value } });
      if (!existing) return { ok: false as const, message: "That product is no longer in your inventory." };

      const taken = await tx.product.findFirst({
        where: { sku: sku.value, NOT: { id: id.value } },
      });
      if (taken) {
        return { ok: false as const, message: `SKU ${sku.value} is already used by ${taken.name}.` };
      }

      const delta = currentStock.value - existing.currentStock;
      await tx.product.update({
        where: { id: id.value },
        data: {
          sku: sku.value,
          name: name.value,
          category: category.value,
          currentStock: currentStock.value,
          reorderPoint: reorderPoint.value,
          costPrice: costPrice.value,
          sellingPrice: sellingPrice.value,
        },
      });

      if (delta !== 0) {
        await tx.transaction.create({
          data: {
            productId: id.value,
            type: "ADJUSTMENT",
            quantity: Math.abs(delta),
            signedQuantity: delta,
            unitAmount: 0,
            totalAmount: 0,
            source: "MANUAL",
            note: "Stock count updated",
          },
        });
      }

      return { ok: true as const };
    });

    if (!result.ok) return result;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, message: `SKU ${sku.value} is already used by another product.` };
    }
    throw error;
  }

  return saved(`${name.value} was updated.`);
}

export async function deleteProduct(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = textField(formData, "id", { label: "the product", max: 80 });
  if (!id.ok) return id;

  const existing = await prisma.product.findUnique({ where: { id: id.value } });
  if (!existing) return { ok: false, message: "That product is already gone." };

  await prisma.product.delete({ where: { id: id.value } });
  return saved(`${existing.name} was removed from your inventory.`);
}

export async function recordPurchase(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const productId = textField(formData, "productId", { label: "which product you bought", max: 80 });
  if (!productId.ok) return productId;
  const quantity = numberField(formData, "quantity", {
    label: "how many you bought",
    min: 1,
    max: 100_000,
    integer: true,
  });
  if (!quantity.ok) return quantity;
  const unitCost = numberField(formData, "unitCost", {
    label: "the cost for each one",
    min: 0,
    max: 1_000_000,
    money: true,
  });
  if (!unitCost.ok) return unitCost;
  const note = textField(formData, "note", { label: "a note", max: 200, required: false });
  if (!note.ok) return note;
  const updateCost = formData.get("updateCost") === "on";

  const product = await prisma.product.findUnique({ where: { id: productId.value } });
  if (!product) return { ok: false, message: "Choose a product from the list." };

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.product.update({
      where: { id: product.id },
      data: {
        currentStock: { increment: quantity.value },
        ...(updateCost ? { costPrice: unitCost.value } : {}),
      },
    });
    await tx.transaction.create({
      data: {
        productId: product.id,
        type: "PURCHASE",
        quantity: quantity.value,
        signedQuantity: quantity.value,
        unitAmount: unitCost.value,
        totalAmount: roundMoney(unitCost.value * quantity.value),
        source: "MANUAL",
        note: note.value,
      },
    });
    return next;
  });

  return saved(
    `Added ${quantity.value} to ${product.name}. You now have ${updated.currentStock} on hand.`,
  );
}

export async function recordSale(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const productId = textField(formData, "productId", { label: "which product you sold", max: 80 });
  if (!productId.ok) return productId;
  const quantity = numberField(formData, "quantity", {
    label: "how many you sold",
    min: 1,
    max: 100_000,
    integer: true,
  });
  if (!quantity.ok) return quantity;
  const unitPrice = numberField(formData, "unitPrice", {
    label: "the price for each one",
    min: 0,
    max: 1_000_000,
    money: true,
  });
  if (!unitPrice.ok) return unitPrice;
  const note = textField(formData, "note", { label: "a note", max: 200, required: false });
  if (!note.ok) return note;

  const product = await prisma.product.findUnique({ where: { id: productId.value } });
  if (!product) return { ok: false, message: "Choose a product from the list." };
  if (product.currentStock <= 0) {
    return {
      ok: false,
      message: `${product.name} is out of stock. Restock it before recording a sale.`,
    };
  }
  if (quantity.value > product.currentStock) {
    return {
      ok: false,
      message: `${product.name} only has ${product.currentStock} on hand, so you can't sell ${quantity.value}.`,
    };
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.product.updateMany({
      where: { id: product.id, currentStock: { gte: quantity.value } },
      data: { currentStock: { decrement: quantity.value } },
    });
    if (result.count === 0) return null;
    await tx.transaction.create({
      data: {
        productId: product.id,
        type: "SALE",
        quantity: quantity.value,
        signedQuantity: -quantity.value,
        unitAmount: unitPrice.value,
        totalAmount: roundMoney(unitPrice.value * quantity.value),
        source: "MANUAL",
        note: note.value,
      },
    });
    return tx.product.findUniqueOrThrow({ where: { id: product.id } });
  });

  if (!updated) {
    return {
      ok: false,
      message: `${product.name} doesn't have enough stock for that sale. Refresh the page and try again.`,
    };
  }

  return saved(
    `Recorded a sale of ${quantity.value} ${product.name}. ${updated.currentStock} left on hand.`,
  );
}

export async function updatePosSync(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const enabled = formData.get("enabled") === "on";
  await prisma.appSetting.upsert({
    where: { id: "app" },
    create: { id: "app", posSyncEnabled: enabled },
    update: { posSyncEnabled: enabled },
  });
  return saved(
    enabled
      ? "The register connection is on. New sales can update your stock."
      : "The register connection is off. Stock will stay put until you turn it back on.",
  );
}

export async function sendSamplePosSale(
  prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  void prev;
  void formData;
  const product = await prisma.product.findFirst({
    where: { currentStock: { gt: 0 } },
    orderBy: { name: "asc" },
  });
  if (!product) {
    return { ok: false, message: "Nothing is in stock to use for a sample sale." };
  }

  try {
    const result = await syncPosPayload({
      sku: product.sku,
      quantity: 1,
      timestamp: new Date().toISOString(),
      note: "Sample sale from Settings",
      externalId: `sample-${crypto.randomUUID()}`,
    });
    const line = result.results[0];
    return saved(
      `Sample sale recorded for ${line.productName}. ${line.remainingStock} left on hand.`,
    );
  } catch (error) {
    if (error instanceof PosSyncError) return { ok: false, message: error.message };
    throw error;
  }
}
