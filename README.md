# Stockroom

A small inventory tracker for people who would rather count jars than configure software. It runs on your computer with Next.js and a SQLite database.

## What you can do

- See stock value, today's sales, this month's sales, low-stock alerts, and purchases.
- Search and filter every product. Green means in stock, yellow means low, red means out.
- Add, edit, and remove products.
- Record a purchase (stock goes up) or a sale (stock goes down). You can't sell more than you have.
- Read one history of every stock change.
- Let a register send sales to Stockroom. Matching items are reduced and filed as **POS Sync**.

## First-time setup

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`npm run db:seed` loads a sample shop so the dashboard is not empty. Run it again any time you want the sample data back.

## Register connection

1. Open **Settings**.
2. Turn the connection on and click **Save**.
3. Copy the webhook address. It looks like `http://localhost:3000/api/webhooks/pos`.
4. Point the register at that address with a POST body like:

```json
{
  "sku": "TEA-003",
  "quantity": 1,
  "timestamp": "2026-10-08T15:04:00.000Z"
}
```

`productId` can be used instead of `sku`. Several sales can be sent together under `sales`, `items`, or `line_items`. Send `externalId` if the register might retry the same sale — Stockroom records it once.

While the connection is off, those messages are ignored.

The sync logic lives in `src/services/posSync.ts`. The webhook route is `src/app/api/webhooks/pos/route.ts`.

## Checks

```bash
npm test
npm run lint
npm run build
```
