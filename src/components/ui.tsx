import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonStyles = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-foreground hover:brightness-105",
        secondary: "border border-border bg-card text-foreground hover:bg-background",
        ghost: "text-foreground hover:bg-background",
        danger: "bg-danger text-white hover:brightness-105",
      },
      size: {
        md: "h-11",
        sm: "h-9 px-3",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export function Button({
  className,
  variant,
  size,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonStyles>) {
  return <button className={cn(buttonStyles({ variant, size }), className)} {...props} />;
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      {hint ? <span className="mt-0.5 block text-sm text-muted">{hint}</span> : null}
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}

export const controlClass =
  "h-11 w-full rounded-xl border border-border bg-background px-3 text-base text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/25";

export function Notice({ ok, message }: { ok: boolean; message: string }) {
  return (
    <p
      role="status"
      className={cn(
        "rounded-xl px-4 py-3 text-sm",
        ok
          ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
          : "bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100",
      )}
    >
      {message}
    </p>
  );
}
