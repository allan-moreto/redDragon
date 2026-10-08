import { ActivityPanel } from "@/components/activity-panel";
import { getLedger, getProducts } from "@/lib/queries";

export default async function ActivityPage() {
  const [products, entries] = await Promise.all([getProducts(), getLedger()]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-accent">Activity</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Purchases and sales</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Every stock change is listed here, including sales that arrived from your register.
        </p>
      </header>
      <ActivityPanel products={products} entries={entries} />
    </div>
  );
}
