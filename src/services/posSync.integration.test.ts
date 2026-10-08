import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { prisma } from "../lib/prisma";
import { PosSyncError, syncPosPayload } from "./posSync";

before(async () => {
  if (!process.env.DATABASE_URL?.includes("test.db")) {
    throw new Error("Refusing to run sync tests outside the test database.");
  }
  await prisma.transaction.deleteMany();
  await prisma.product.deleteMany();
  await prisma.appSetting.deleteMany();
  await prisma.appSetting.create({ data: { id: "app", posSyncEnabled: false } });
  await prisma.product.create({
    data: {
      sku: "TEA-003",
      name: "Earl Grey Tea",
      category: "Drinks",
      currentStock: 5,
      reorderPoint: 2,
      costPrice: 3.4,
      sellingPrice: 6.5,
    },
  });
});

after(async () => {
  await prisma.$disconnect();
});

test("refuses sales while the connection is off", async () => {
  await assert.rejects(
    () => syncPosPayload({ sku: "TEA-003", quantity: 1 }),
    (error: unknown) => error instanceof PosSyncError && error.status === 403,
  );
  const product = await prisma.product.findUniqueOrThrow({ where: { sku: "TEA-003" } });
  assert.equal(product.currentStock, 5);
});

test("deducts stock and writes a POS Sync sale", async () => {
  await prisma.appSetting.update({ where: { id: "app" }, data: { posSyncEnabled: true } });
  const result = await syncPosPayload({
    sku: "tea-003",
    quantitySold: 2,
    timestamp: "2026-10-08T15:04:00.000Z",
    externalId: "order-22",
  });
  assert.equal(result.results[0].remainingStock, 3);
  assert.equal(result.results[0].alreadyRecorded, false);

  const entry = await prisma.transaction.findUniqueOrThrow({ where: { externalId: "order-22" } });
  assert.equal(entry.source, "POS_SYNC");
  assert.equal(entry.type, "SALE");
  assert.equal(entry.signedQuantity, -2);
  assert.equal(entry.totalAmount, 13);
});

test("does not deduct again when the same event is sent twice", async () => {
  const result = await syncPosPayload({
    sku: "TEA-003",
    quantity: 2,
    externalId: "order-22",
  });
  assert.equal(result.results[0].alreadyRecorded, true);
  const product = await prisma.product.findUniqueOrThrow({ where: { sku: "TEA-003" } });
  assert.equal(product.currentStock, 3);
});

test("leaves stock unchanged when the sale is larger than what is on hand", async () => {
  await assert.rejects(
    () => syncPosPayload({ sku: "TEA-003", quantity: 9 }),
    (error: unknown) => error instanceof PosSyncError && error.status === 409,
  );
  const product = await prisma.product.findUniqueOrThrow({ where: { sku: "TEA-003" } });
  assert.equal(product.currentStock, 3);
});

test("reports an unknown product", async () => {
  await assert.rejects(
    () => syncPosPayload({ sku: "MISSING", quantity: 1 }),
    (error: unknown) => error instanceof PosSyncError && error.status === 404,
  );
});
