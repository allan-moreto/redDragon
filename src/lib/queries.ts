import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  roundMoney,
  startOfMonth,
  startOfToday,
  stockStatus,
  type TransactionSource,
  type TransactionType,
} from "@/lib/inventory";
import type { Kpis, LedgerEntry, ProductDTO } from "@/lib/types";

function toProduct(product: {
  id: string;
  sku: string;
  name: string;
  category: string;
  currentStock: number;
  reorderPoint: number;
  costPrice: number;
  sellingPrice: number;
}): ProductDTO {
  return {
    ...product,
    status: stockStatus(product.currentStock, product.reorderPoint),
  };
}

function toEntry(entry: {
  id: string;
  productId: string;
  type: string;
  quantity: number;
  signedQuantity: number;
  unitAmount: number;
  totalAmount: number;
  source: string;
  note: string;
  occurredAt: Date;
  product: { name: string; sku: string };
}): LedgerEntry {
  return {
    id: entry.id,
    productId: entry.productId,
    productName: entry.product.name,
    sku: entry.product.sku,
    type: entry.type as TransactionType,
    quantity: entry.quantity,
    signedQuantity: entry.signedQuantity,
    unitAmount: entry.unitAmount,
    totalAmount: entry.totalAmount,
    source: entry.source as TransactionSource,
    note: entry.note,
    occurredAt: entry.occurredAt.toISOString(),
  };
}

async function sumAmount(
  type: TransactionType,
  since?: Date,
) {
  const result = await prisma.transaction.aggregate({
    where: {
      type,
      ...(since ? { occurredAt: { gte: since } } : {}),
    },
    _sum: { totalAmount: true },
  });
  return roundMoney(result._sum.totalAmount ?? 0);
}

export async function getProducts(): Promise<ProductDTO[]> {
  await connection();
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
  });
  return products.map(toProduct);
}

export async function getKpis(products: ProductDTO[]): Promise<Kpis> {
  const today = startOfToday();
  const month = startOfMonth();
  const [salesToday, salesMonth, purchasesMonth, purchasesAll] = await Promise.all([
    sumAmount("SALE", today),
    sumAmount("SALE", month),
    sumAmount("PURCHASE", month),
    sumAmount("PURCHASE"),
  ]);

  const stockValue = roundMoney(
    products.reduce((total, product) => total + product.currentStock * product.costPrice, 0),
  );

  return {
    stockValue,
    salesToday,
    salesMonth,
    purchasesMonth,
    purchasesAll,
    lowStockCount: products.filter((product) => product.status !== "in").length,
  };
}

export async function getLedger(limit = 500): Promise<LedgerEntry[]> {
  await connection();
  const entries = await prisma.transaction.findMany({
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: { product: true },
  });
  return entries.map(toEntry);
}

export async function getSettings() {
  await connection();
  const settings = await prisma.appSetting.findUnique({ where: { id: "app" } });
  return { posSyncEnabled: settings?.posSyncEnabled ?? false };
}

export async function getDashboardData() {
  const products = await getProducts();
  const [kpis, recent] = await Promise.all([getKpis(products), getLedger(6)]);
  return { products, kpis, recent };
}
