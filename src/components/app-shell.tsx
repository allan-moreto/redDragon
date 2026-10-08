"use client";

import { ClipboardList, LayoutDashboard, Package, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/activity", label: "Activity", icon: ClipboardList },
  { href: "/settings", label: "Settings", icon: Settings },
];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
        <Package className="h-5 w-5" aria-hidden />
      </span>
      {compact ? (
        <span className="text-base font-semibold">Stockroom</span>
      ) : (
        <span>
          <span className="block text-base font-semibold">Stockroom</span>
          <span className="block text-sm text-sidebar-foreground/70">Inventory for your shop</span>
        </span>
      )}
    </Link>
  );
}

function Nav({ layout }: { layout: "side" | "top" }) {
  const pathname = usePathname();
  return (
    <nav className={cn("flex gap-1", layout === "side" ? "flex-col px-3" : "px-3 pb-3")} aria-label="Main">
      {links.map((link) => {
        const active = pathname === link.href;
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium",
              layout === "side"
                ? active
                  ? "bg-white/15 text-white"
                  : "text-sidebar-foreground/80 hover:bg-white/10"
                : active
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground hover:bg-card",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <div className="px-5 py-6">
          <Brand />
        </div>
        <Nav layout="side" />
        <p className="mt-auto px-5 pb-6 text-sm text-sidebar-foreground/70">
          Your numbers stay on this computer.
        </p>
      </aside>
      <div>
        <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Brand compact />
            <ThemeToggle />
          </div>
          <Nav layout="top" />
        </header>
        <div className="mx-auto hidden w-full max-w-6xl justify-end px-8 pt-6 lg:flex">
          <ThemeToggle />
        </div>
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:pt-4">{children}</main>
      </div>
    </div>
  );
}
