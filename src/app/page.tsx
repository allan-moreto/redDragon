import { InventoryPanel } from "@/components/inventory-panel";
import { KpiGrid } from "@/components/kpi-grid";
import { RecentActivity } from "@/components/recent-activity";
import { getDashboardData } from "@/lib/queries";

export default async function HomePage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-accent">Dashboard</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Your shelves</h1>
        <p className="mt-2 max-w-2xl text-muted">
          See what you have, what sold, and what to reorder. Search the list, or record a purchase or sale when something changes.
        </p>
      </header>
      <KpiGrid kpis={data.kpis} />
      <InventoryPanel products={data.products} />
      <RecentActivity entries={data.recent} />
    </div>
  );
}
