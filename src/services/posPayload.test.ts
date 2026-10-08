import assert from "node:assert/strict";
import { test } from "node:test";
import { parsePosPayload } from "./posPayload";

test("parses a simple register sale", () => {
  const result = parsePosPayload({
    sku: "tea-003",
    quantity: 2,
    timestamp: "2026-10-08T15:00:00.000Z",
    externalId: "order-1",
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.sales.length, 1);
  assert.equal(result.sales[0].sku, "tea-003");
  assert.equal(result.sales[0].quantity, 2);
  assert.equal(result.sales[0].externalId, "order-1");
  assert.equal(result.sales[0].occurredAt?.toISOString(), "2026-10-08T15:00:00.000Z");
});

test("accepts quantity aliases and a list of sales", () => {
  const result = parsePosPayload({
    items: [
      { product_sku: "HNY-001", quantity_sold: "1" },
      { productId: "prod_1", qty: 3, notes: "Line two" },
    ],
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(
    result.sales.map((sale) => [sale.sku, sale.productId, sale.quantity, sale.note]),
    [
      ["HNY-001", undefined, 1, undefined],
      [undefined, "prod_1", 3, "Line two"],
    ],
  );
});

test("unwraps a nested register payload", () => {
  const result = parsePosPayload({
    data: {
      object: {
        line_items: [{ sku: "CHIP-11", quantity: 1 }],
      },
    },
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.sales[0].sku, "CHIP-11");
});

test("rejects a sale that would not change stock", () => {
  const zero = parsePosPayload({ sku: "HNY-001", quantity: 0 });
  const fraction = parsePosPayload({ sku: "HNY-001", quantity: 1.5 });
  const missing = parsePosPayload({ quantity: 1 });
  const badDate = parsePosPayload({ sku: "HNY-001", quantity: 1, timestamp: "tomorrow" });
  assert.equal(zero.ok, false);
  assert.equal(fraction.ok, false);
  assert.equal(missing.ok, false);
  assert.equal(badDate.ok, false);
});

test("rejects duplicate event ids in one payload", () => {
  const result = parsePosPayload({
    sales: [
      { sku: "HNY-001", quantity: 1, externalId: "same" },
      { sku: "TEA-003", quantity: 1, externalId: "same" },
    ],
  });
  assert.equal(result.ok, false);
});
