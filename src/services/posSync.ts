import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { roundMoney } from "@/lib/inventory";
import { parsePosPayload, type ParsedPosSale } from "@/services/posPayload";

export class PosSyncError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "PosSyncError";
    this.status = status;
  }
}

export type PosSyncLine = {
  sku: string;
  productId: string;
  productName: string;
  quantitySold: number;
  remainingStock: number;
  transactionId: string;
  alreadyRecorded: boolean;
};

async function findProduct(tx: Prisma.TransactionClient, sale: ParsedPosSale) {
  if (sale.sku) {
    return tx.product.findUnique({ where: { sku: sale.sku.trim().toUpperCase() } });
  }
  if (sale.productId) {
    return tx.product.findUnique({ where: { id: sale.productId } });
  }
  return null;
}

async function applyOne(tx: Prisma.TransactionClient, sale: ParsedPosSale): Promise<PosSyncLine> {
  if (sale.externalId) {
    const existing = await tx.transaction.findUnique({
      where: { externalId: sale.externalId },
      include: { product: true },
    });
    if (existing) {
      return {
        sku: existing.product.sku,
        productId: existing.product.id,
        productName: existing.product.name,
        quantitySold: existing.quantity,
        remainingStock: existing.product.currentStock,
        transactionId: existing.id,
        alreadyRecorded: true,
      };
    }
  }

  const product = await findProduct(tx, sale);
  const label = sale.sku ?? sale.productId ?? "that product";
  if (!product) {
    throw new PosSyncError(
      `No product matches ${label}. Check the SKU and try again.`,
      404,
    );
  }

  if (product.currentStock <= 0) {
    throw new PosSyncError(
      `${product.name} is out of stock, so this register sale was not recorded.`,
      409,
    );
  }

  const updated = await tx.product.updateMany({
    where: { id: product.id, currentStock: { gte: sale.quantity } },
    data: { currentStock: { decrement: sale.quantity } },
  });

  if (updated.count === 0) {
    throw new PosSyncError(
      `${product.name} only has ${product.currentStock} on hand, so a sale of ${sale.quantity} was not recorded.`,
      409,
    );
  }

  const current = await tx.product.findUniqueOrThrow({ where: { id: product.id } });
  const entry = await tx.transaction.create({
    data: {
      productId: product.id,
      type: "SALE",
      quantity: sale.quantity,
      signedQuantity: -sale.quantity,
      unitAmount: current.sellingPrice,
      totalAmount: roundMoney(current.sellingPrice * sale.quantity),
      source: "POS_SYNC",
      note: sale.note?.trim() || "Sold through the register",
      externalId: sale.externalId,
      occurredAt: sale.occurredAt ?? new Date(),
    },
  });

  return {
    sku: current.sku,
    productId: current.id,
    productName: current.name,
    quantitySold: sale.quantity,
    remainingStock: current.currentStock,
    transactionId: entry.id,
    alreadyRecorded: false,
  };
}

export async function syncPosPayload(body: unknown) {
  const settings = await prisma.appSetting.findUnique({ where: { id: "app" } });
  if (!settings?.posSyncEnabled) {
    throw new PosSyncError(
      "POS sync is turned off. Turn it on in Settings to accept sales from your register.",
      403,
    );
  }

  const parsed = parsePosPayload(body);
  if (!parsed.ok) {
    throw new PosSyncError(parsed.error, 400);
  }

  const results = await prisma.$transaction(async (tx) => {
    const lines: PosSyncLine[] = [];
    for (const sale of parsed.sales) {
      lines.push(await applyOne(tx, sale));
    }
    return lines;
  });

  return { ok: true as const, source: "POS Sync" as const, results };
}
