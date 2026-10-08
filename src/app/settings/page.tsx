import { headers } from "next/headers";
import { SettingsPanel } from "@/components/settings-panel";
import { getProducts, getSettings } from "@/lib/queries";

export default async function SettingsPage() {
  const [settings, products, headerList] = await Promise.all([
    getSettings(),
    getProducts(),
    headers(),
  ]);
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const proto = headerList.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const sample = products.find((product) => product.currentStock > 0) ?? products[0];

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-accent">Settings</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Connect a register</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Turn the connection on when you want sales from a register, like Square, Shopify, or Clover, to update stock for you.
        </p>
      </header>
      <SettingsPanel
        enabled={settings.posSyncEnabled}
        webhookUrl={`${proto}://${host}/api/webhooks/pos`}
        sampleSku={sample?.sku ?? "TEA-003"}
      />
    </div>
  );
}
