export type ParsedPosSale = {
  sku?: string;
  productId?: string;
  quantity: number;
  occurredAt?: Date;
  externalId?: string;
  note?: string;
};

export type ParseResult =
  | { ok: true; sales: ParsedPosSale[] }
  | { ok: false; error: string };

const SKU_KEYS = ["sku", "SKU", "product_sku", "productSku"];
const PRODUCT_ID_KEYS = ["productId", "product_id"];
const QUANTITY_KEYS = ["quantity", "quantitySold", "quantity_sold", "qty"];
const TIMESTAMP_KEYS = ["timestamp", "created_at", "createdAt", "sold_at", "soldAt"];
const EVENT_KEYS = ["externalId", "external_id", "eventId", "event_id"];
const NOTE_KEYS = ["note", "notes"];
const LIST_KEYS = ["sales", "items", "line_items", "lineItems"];

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function pickString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return undefined;
}

function unwrap(body: Record<string, unknown>) {
  const data = asRecord(body.data);
  const nested = data ? asRecord(data.object) ?? data : null;
  if (!nested) return body;
  const hasSaleShape =
    LIST_KEYS.some((key) => nested[key] !== undefined) ||
    SKU_KEYS.some((key) => nested[key] !== undefined) ||
    QUANTITY_KEYS.some((key) => nested[key] !== undefined);
  return hasSaleShape ? { ...body, ...nested } : body;
}

function parseQuantity(record: Record<string, unknown>, label: string): { ok: false; error: string } | number {
  const key = QUANTITY_KEYS.find((name) => record[name] !== undefined);
  if (!key) {
    return { ok: false, error: `${label} needs a quantity sold.` };
  }
  const raw = record[key];
  const num = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : Number.NaN;
  if (!Number.isFinite(num) || !Number.isInteger(num)) {
    return {
      ok: false,
      error: `${label} needs a whole-number quantity, like 1 or 2.`,
    };
  }
  if (num <= 0) {
    return { ok: false, error: `${label} quantity must be at least 1.` };
  }
  if (num > 100000) {
    return { ok: false, error: `${label} quantity looks too large.` };
  }
  return num;
}

function parseOne(
  record: Record<string, unknown>,
  label: string,
  fallbackEventId?: string,
): { ok: true; sale: ParsedPosSale } | { ok: false; error: string } {
  const sku = pickString(record, SKU_KEYS);
  const productId = pickString(record, PRODUCT_ID_KEYS);
  if (!sku && !productId) {
    return { ok: false, error: `${label} needs a product SKU or product ID.` };
  }

  const quantity = parseQuantity(record, label);
  if (typeof quantity !== "number") return quantity;

  let occurredAt: Date | undefined;
  const timestamp = pickString(record, TIMESTAMP_KEYS);
  if (timestamp) {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return { ok: false, error: `${label} has a timestamp that is not a valid date.` };
    }
    occurredAt = date;
  }

  const note = pickString(record, NOTE_KEYS);
  const externalId = pickString(record, EVENT_KEYS) ?? fallbackEventId;

  return {
    ok: true,
    sale: {
      sku,
      productId,
      quantity,
      occurredAt,
      externalId,
      note,
    },
  };
}

export function parsePosPayload(body: unknown): ParseResult {
  const record = asRecord(body);
  if (!record) {
    return { ok: false, error: "Send a JSON object with the product SKU and quantity sold." };
  }

  const payload = unwrap(record);
  const listKey = LIST_KEYS.find((key) => Array.isArray(payload[key]));
  const entries = listKey ? (payload[listKey] as unknown[]) : [payload];

  if (entries.length === 0) {
    return { ok: false, error: "No sales were included in the payload." };
  }

  const fallbackEventId = listKey ? undefined : pickString(payload, EVENT_KEYS);
  const sales: ParsedPosSale[] = [];

  for (let index = 0; index < entries.length; index += 1) {
    const item = asRecord(entries[index]);
    const label = entries.length === 1 ? "This sale" : `Sale ${index + 1}`;
    if (!item) {
      return { ok: false, error: `${label} needs to be a JSON object.` };
    }
    const parsed = parseOne(item, label, entries.length === 1 ? fallbackEventId : undefined);
    if (!parsed.ok) return parsed;
    sales.push(parsed.sale);
  }

  const eventIds = sales.map((sale) => sale.externalId).filter((id): id is string => Boolean(id));
  if (new Set(eventIds).size !== eventIds.length) {
    return { ok: false, error: "Each sale in one payload needs its own event id." };
  }

  return { ok: true, sales };
}
