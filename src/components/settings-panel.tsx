"use client";

import { Check, Copy } from "lucide-react";
import { useActionState, useState } from "react";
import { sendSamplePosSale, updatePosSync } from "@/lib/actions";
import { Button, Notice } from "@/components/ui";

export function SettingsPanel({
  enabled,
  webhookUrl,
  sampleSku,
}: {
  enabled: boolean;
  webhookUrl: string;
  sampleSku: string;
}) {
  const [syncState, syncAction, syncPending] = useActionState(updatePosSync, null);
  const [sampleState, sampleAction, samplePending] = useActionState(sendSamplePosSale, null);
  const [copied, setCopied] = useState(false);
  const sample = `{
  "sku": "${sampleSku}",
  "quantity": 1,
  "timestamp": "2026-10-08T15:04:00.000Z"
}`;

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-4">
      {syncState ? <Notice ok={syncState.ok} message={syncState.message} /> : null}
      {sampleState ? <Notice ok={sampleState.ok} message={sampleState.message} /> : null}

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Register connection</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          When this is on, your register can tell Stockroom about a sale and the shelf count goes down on its own.
          When it is off, those messages are ignored and nothing changes.
        </p>
        <form action={syncAction} key={String(enabled)} className="mt-5 space-y-4">
          <label className="flex items-center gap-3">
            <span className="relative inline-flex">
              <input name="enabled" type="checkbox" defaultChecked={enabled} className="peer sr-only" />
              <span className="h-7 w-12 rounded-full bg-border transition peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40" />
              <span className="pointer-events-none absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
            </span>
            <span className="text-sm font-medium">{enabled ? "Connection is on" : "Connection is off"}</span>
          </label>
          <p className="text-sm text-muted">Flip the switch, then save.</p>
          <Button type="submit" disabled={syncPending}>
            {syncPending ? "Saving..." : "Save"}
          </Button>
        </form>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Webhook address</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Give this address to whoever sets up your register. Anyone who can reach it can record sales while the connection is on, so keep Stockroom on this computer.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            data-testid="webhook-url"
            readOnly
            value={webhookUrl}
            className="h-11 w-full rounded-xl border border-border bg-background px-3 font-mono text-sm"
            aria-label="Webhook address"
            onFocus={(event) => event.currentTarget.select()}
          />
          <Button type="button" variant="secondary" onClick={copyUrl}>
            {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        <h3 className="mt-6 text-sm font-semibold">What the register should send</h3>
        <p className="mt-1 text-sm text-muted">
          A short note with the product SKU, how many sold, and when. Stockroom matches the SKU, lowers the count, and files the sale as POS Sync.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-[#10211c] p-4 text-sm text-[#e7f3ec]">
          <code>{sample}</code>
        </pre>
        <form action={sampleAction} className="mt-4">
          <Button type="submit" variant="secondary" disabled={samplePending || !enabled}>
            {samplePending ? "Sending..." : "Send a sample sale"}
          </Button>
          <p className="mt-2 text-sm text-muted">
            {enabled
              ? "This subtracts 1 from the first item that still has stock, so you can see the connection work."
              : "Turn the connection on and save before sending a sample."}
          </p>
        </form>
      </section>
    </div>
  );
}
