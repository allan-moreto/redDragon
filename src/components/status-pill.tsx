import { STATUS_LABEL, type StockStatus } from "@/lib/inventory";
import { cn } from "@/lib/cn";

const styles: Record<StockStatus, string> = {
  in: "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-100 dark:ring-emerald-900",
  low: "bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-950 dark:text-amber-100 dark:ring-amber-900",
  out: "bg-red-50 text-red-800 ring-red-200 dark:bg-red-950 dark:text-red-100 dark:ring-red-900",
};

export function StatusPill({ status }: { status: StockStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset", styles[status])}>
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "in" && "bg-emerald-600",
          status === "low" && "bg-amber-500",
          status === "out" && "bg-red-600",
        )}
        aria-hidden
      />
      {STATUS_LABEL[status]}
    </span>
  );
}
