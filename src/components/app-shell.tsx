"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CreditCard, History, LayoutDashboard, LogOut } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  clearPortalProfile,
  clearPortalToken,
  getPortalProfile,
  type PortalProfile,
} from "@/lib/auth";
import { useIsClient } from "@/lib/use-is-client";

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sessions", label: "Sessions", icon: History },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const isClient = useIsClient();
  const isLogin = pathname.startsWith("/login");
  const profile: PortalProfile | null = isClient ? getPortalProfile() : null;

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <div className="shell">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="container-shell">
          <div className="flex min-h-[72px] items-center justify-between gap-3">
            <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
              <BrandLogo className="shrink-0" />
              <div className="hidden min-w-0 sm:block">
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Zenvana
                </div>
                <div className="truncate text-sm font-semibold text-foreground">
                  Payments Portal
                </div>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => {
                  clearPortalToken();
                  clearPortalProfile();
                  router.push("/login");
                }}
                className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                <LogOut className="size-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="border-b border-border/60 bg-card/60 backdrop-blur-xl">
        <div className="container-shell">
          <div className="flex items-center gap-2 overflow-x-auto py-2.5">
            {navItems.map((item) => {
              const active = isActivePath(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium transition-all",
                    active
                      ? "border-primary/25 bg-primary/12 text-foreground"
                      : "border-border/70 bg-background text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  <Icon className="size-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            {profile ? (
              <div className="ml-auto hidden rounded-full border border-border/60 bg-background px-3 py-1.5 text-[11px] text-muted-foreground md:inline-flex">
                {profile.firstName} {profile.lastName} · {profile.role}
              </div>
            ) : null}
          </div>
        </div>
      </nav>

      <main className="container-shell py-5 sm:py-6">{children}</main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/95 p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden">
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/dashboard"
            className={[
              "inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium",
              isActivePath(pathname, "/dashboard")
                ? "border-primary/30 bg-primary/12 text-foreground"
                : "border-border/70 bg-card text-muted-foreground",
            ].join(" ")}
          >
            <LayoutDashboard className="size-3.5" />
            Dashboard
          </Link>
          <Link
            href="/sessions"
            className={[
              "inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium",
              isActivePath(pathname, "/sessions")
                ? "border-primary/30 bg-primary/12 text-foreground"
                : "border-border/70 bg-card text-muted-foreground",
            ].join(" ")}
          >
            <History className="size-3.5" />
            Sessions
          </Link>
        </div>
      </div>

      <div className="h-[74px] md:hidden" />
      <footer className="mt-6 border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        <div className="inline-flex items-center gap-1.5">
          <CreditCard className="size-3.5" />
          <span>Zenvana Payments</span>
        </div>
      </footer>
    </div>
  );
}
