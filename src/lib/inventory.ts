export type StockStatus = "in" | "low" | "out";

export type TransactionType = "PURCHASE" | "SALE" | "ADJUSTMENT";

export type TransactionSource = "MANUAL" | "POS_SYNC";

export function stockStatus(stock: number, reorderPoint: number): StockStatus {
  if (stock <= 0) return "out";
  if (stock <= reorderPoint) return "low";
  return "in";
}

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatWhen(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export const STATUS_LABEL: Record<StockStatus, string> = {
  in: "In stock",
  low: "Low stock",
  out: "Out of stock",
};

export const TYPE_LABEL: Record<TransactionType, string> = {
  PURCHASE: "Purchase",
  SALE: "Sale",
  ADJUSTMENT: "Stock count",
};

export const SOURCE_LABEL: Record<TransactionSource, string> = {
  MANUAL: "Entered by you",
  POS_SYNC: "POS Sync",
};

export function startOfToday(now = new Date()) {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function startOfMonth(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}
