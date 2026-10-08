import { prisma } from "../src/lib/prisma";
import { roundMoney } from "../src/lib/inventory";

type CatalogItem = {
  sku: string;
  name: string;
  category: string;
  reorderPoint: number;
  costPrice: number;
  sellingPrice: number;
};

type Movement = {
  sku: string;
  type: "PURCHASE" | "SALE";
  quantity: number;
  daysAgo: number;
  hour: number;
  source: "MANUAL" | "POS_SYNC";
  note: string;
};

const catalog: CatalogItem[] = [
  { sku: "HNY-001", name: "Local Honey, 12 oz", category: "Pantry", reorderPoint: 6, costPrice: 4.5, sellingPrice: 8 },
  { sku: "OAT-014", name: "Oat Milk, 32 oz", category: "Drinks", reorderPoint: 8, costPrice: 2.1, sellingPrice: 4.25 },
  { sku: "TEA-003", name: "Earl Grey Tea", category: "Drinks", reorderPoint: 8, costPrice: 3.4, sellingPrice: 6.5 },
  { sku: "RCE-220", name: "Jasmine Rice, 5 lb", category: "Pantry", reorderPoint: 6, costPrice: 6, sellingPrice: 11 },
  { sku: "SOAP-07", name: "Castile Soap", category: "Household", reorderPoint: 5, costPrice: 3.25, sellingPrice: 7 },
  { sku: "CHIP-11", name: "Sea Salt Chips", category: "Snacks", reorderPoint: 12, costPrice: 1.1, sellingPrice: 2.75 },
  { sku: "COF-100", name: "House Coffee Beans", category: "Drinks", reorderPoint: 4, costPrice: 8.5, sellingPrice: 16 },
  { sku: "PAS-002", name: "Sourdough Loaf", category: "Bakery", reorderPoint: 4, costPrice: 2, sellingPrice: 6 },
  { sku: "OIL-018", name: "Olive Oil, 500 ml", category: "Pantry", reorderPoint: 4, costPrice: 7.75, sellingPrice: 14.5 },
  { sku: "SPN-033", name: "Paper Towels", category: "Household", reorderPoint: 6, costPrice: 1.8, sellingPrice: 3.99 },
  { sku: "GRN-008", name: "Honey Granola", category: "Snacks", reorderPoint: 6, costPrice: 3, sellingPrice: 6.25 },
  { sku: "WTR-500", name: "Sparkling Water, 8 pack", category: "Drinks", reorderPoint: 6, costPrice: 3.6, sellingPrice: 7.5 },
];

const movements: Movement[] = [
  { sku: "HNY-001", type: "PURCHASE", quantity: 24, daysAgo: 20, hour: 9, source: "MANUAL", note: "Market delivery" },
  { sku: "HNY-001", type: "SALE", quantity: 6, daysAgo: 8, hour: 14, source: "MANUAL", note: "Counter sale" },
  { sku: "HNY-001", type: "SALE", quantity: 2, daysAgo: 0, hour: 11, source: "POS_SYNC", note: "Sold through the register" },
  { sku: "OAT-014", type: "PURCHASE", quantity: 12, daysAgo: 18, hour: 10, source: "MANUAL", note: "Weekly restock" },
  { sku: "OAT-014", type: "SALE", quantity: 8, daysAgo: 4, hour: 15, source: "MANUAL", note: "Counter sale" },
  { sku: "OAT-014", type: "SALE", quantity: 4, daysAgo: 1, hour: 12, source: "MANUAL", note: "Counter sale" },
  { sku: "TEA-003", type: "PURCHASE", quantity: 20, daysAgo: 25, hour: 9, source: "MANUAL", note: "Opening order" },
  { sku: "TEA-003", type: "SALE", quantity: 10, daysAgo: 10, hour: 16, source: "MANUAL", note: "Counter sale" },
  { sku: "TEA-003", type: "SALE", quantity: 7, daysAgo: 2, hour: 13, source: "MANUAL", note: "Counter sale" },
  { sku: "SOAP-07", type: "PURCHASE", quantity: 10, daysAgo: 15, hour: 11, source: "MANUAL", note: "Market delivery" },
  { sku: "SOAP-07", type: "SALE", quantity: 8, daysAgo: 3, hour: 17, source: "MANUAL", note: "Counter sale" },
  { sku: "PAS-002", type: "PURCHASE", quantity: 8, daysAgo: 3, hour: 7, source: "MANUAL", note: "Bakery drop-off" },
  { sku: "PAS-002", type: "SALE", quantity: 7, daysAgo: 1, hour: 18, source: "MANUAL", note: "Counter sale" },
  { sku: "SPN-033", type: "PURCHASE", quantity: 6, daysAgo: 12, hour: 10, source: "MANUAL", note: "Weekly restock" },
  { sku: "SPN-033", type: "SALE", quantity: 6, daysAgo: 2, hour: 11, source: "MANUAL", note: "Counter sale" },
  { sku: "RCE-220", type: "PURCHASE", quantity: 24, daysAgo: 14, hour: 9, source: "MANUAL", note: "Market delivery" },
  { sku: "RCE-220", type: "SALE", quantity: 2, daysAgo: 5, hour: 15, source: "MANUAL", note: "Counter sale" },
  { sku: "CHIP-11", type: "PURCHASE", quantity: 48, daysAgo: 4, hour: 9, source: "MANUAL", note: "Weekly restock" },
  { sku: "CHIP-11", type: "SALE", quantity: 3, daysAgo: 2, hour: 16, source: "MANUAL", note: "Counter sale" },
  { sku: "CHIP-11", type: "SALE", quantity: 5, daysAgo: 0, hour: 13, source: "MANUAL", note: "Counter sale" },
  { sku: "COF-100", type: "PURCHASE", quantity: 12, daysAgo: 11, hour: 8, source: "MANUAL", note: "Roaster delivery" },
  { sku: "COF-100", type: "SALE", quantity: 2, daysAgo: 4, hour: 10, source: "MANUAL", note: "Counter sale" },
  { sku: "COF-100", type: "SALE", quantity: 1, daysAgo: 0, hour: 9, source: "POS_SYNC", note: "Sold through the register" },
  { sku: "OIL-018", type: "PURCHASE", quantity: 16, daysAgo: 21, hour: 10, source: "MANUAL", note: "Opening order" },
  { sku: "OIL-018", type: "SALE", quantity: 2, daysAgo: 7, hour: 14, source: "MANUAL", note: "Counter sale" },
  { sku: "GRN-008", type: "PURCHASE", quantity: 20, daysAgo: 8, hour: 11, source: "MANUAL", note: "Market delivery" },
  { sku: "GRN-008", type: "SALE", quantity: 2, daysAgo: 3, hour: 12, source: "MANUAL", note: "Counter sale" },
  { sku: "WTR-500", type: "PURCHASE", quantity: 18, daysAgo: 6, hour: 9, source: "MANUAL", note: "Weekly restock" },
  { sku: "WTR-500", type: "SALE", quantity: 4, daysAgo: 2, hour: 15, source: "POS_SYNC", note: "Sold through the register" },
  { sku: "WTR-500", type: "SALE", quantity: 3, daysAgo: 0, hour: 17, source: "MANUAL", note: "Counter sale" },
];

function atDaysAgo(daysAgo: number, hour: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, daysAgo === 0 ? 15 : 0, 0, 0);
  return date;
}

async function main() {
  await prisma.transaction.deleteMany();
  await prisma.product.deleteMany();
  await prisma.appSetting.deleteMany();

  const bySku = new Map(catalog.map((item) => [item.sku, item]));
  const stock = new Map(catalog.map((item) => [item.sku, 0]));
  const ordered = [...movements].sort(
    (a, b) => atDaysAgo(a.daysAgo, a.hour).getTime() - atDaysAgo(b.daysAgo, b.hour).getTime(),
  );

  for (const movement of ordered) {
    const item = bySku.get(movement.sku);
    if (!item) throw new Error(`Unknown SKU in seed: ${movement.sku}`);
    const current = stock.get(movement.sku) ?? 0;
    const next = movement.type === "PURCHASE" ? current + movement.quantity : current - movement.quantity;
    if (next < 0) throw new Error(`Seed would make ${movement.sku} negative.`);
    stock.set(movement.sku, next);
  }

  await prisma.appSetting.create({
    data: { id: "app", posSyncEnabled: true },
  });

  for (const item of catalog) {
    const product = await prisma.product.create({
      data: {
        ...item,
        currentStock: stock.get(item.sku) ?? 0,
      },
    });

    const history = ordered.filter((movement) => movement.sku === item.sku);
    for (const movement of history) {
      const unitAmount = movement.type === "PURCHASE" ? item.costPrice : item.sellingPrice;
      const signed = movement.type === "PURCHASE" ? movement.quantity : -movement.quantity;
      await prisma.transaction.create({
        data: {
          productId: product.id,
          type: movement.type,
          quantity: movement.quantity,
          signedQuantity: signed,
          unitAmount,
          totalAmount: roundMoney(unitAmount * movement.quantity),
          source: movement.source,
          note: movement.note,
          occurredAt: atDaysAgo(movement.daysAgo, movement.hour),
          externalId: movement.source === "POS_SYNC"
            ? `seed-${item.sku}-${movement.daysAgo}-${movement.hour}`
            : undefined,
        },
      });
    }
  }

  const low = catalog.filter((item) => (stock.get(item.sku) ?? 0) <= item.reorderPoint).length;
  console.log(`Seeded ${catalog.length} products. ${low} need attention.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
