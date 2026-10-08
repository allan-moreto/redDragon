import type { StockStatus, TransactionSource, TransactionType } from "@/lib/inventory";

export type ProductDTO = {
  id: string;
  sku: string;
  name: string;
  category: string;
  currentStock: number;
  reorderPoint: number;
  costPrice: number;
  sellingPrice: number;
  status: StockStatus;
};

export type LedgerEntry = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: TransactionType;
  quantity: number;
  signedQuantity: number;
  unitAmount: number;
  totalAmount: number;
  source: TransactionSource;
  note: string;
  occurredAt: string;
};

export type Kpis = {
  stockValue: number;
  salesToday: number;
  salesMonth: number;
  purchasesMonth: number;
  purchasesAll: number;
  lowStockCount: number;
};

export type ActionState = {
  ok: boolean;
  message: string;
} | null;
