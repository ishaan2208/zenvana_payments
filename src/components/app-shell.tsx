"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  History,
  LogOut,
  Moon,
  Sun,
  Building2,
  UtensilsCrossed,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { clearPortalSession, getPortalProfile, getPortalToken } from "@/lib/auth";
import {
  type AccessibleScope,
  listAccessibleScopes,
  scopeKey,
  switchActiveScope,
} from "@/lib/scopes";
import { useIsClient } from "@/lib/use-is-client";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Collect", Icon: CreditCard },
  { href: "/sessions", label: "History", Icon: History },
];

function useTheme() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = window.localStorage.getItem("zenvana-theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    document.documentElement.classList.toggle("dark", dark);
    window.localStorage.setItem("zenvana-theme", dark ? "dark" : "light");
  }, [dark]);

  const toggle = () => {
    setDark((d) => !d);
  };
  return { dark, toggle };
}

/**
 * Lets an admin switch the active property/restaurant the portal collects for.
 * Mirrors web2's admin property switcher: it only appears for ADMIN logins with
 * more than one accessible scope, and a hard reload after switching guarantees
 * every scope-bound view (queue, history) reloads against the new token.
 */
function ScopeSwitcher({ isClient }: { isClient: boolean }) {
  const token = useMemo(() => (isClient ? getPortalToken() : null), [isClient]);
  const profile = useMemo(() => (isClient ? getPortalProfile() : null), [isClient]);
  const isAdmin = String(profile?.role ?? "").toUpperCase() === "ADMIN";

  const [scopes, setScopes] = useState<AccessibleScope[]>([]);
  const [switching, setSwitching] = useState(false);

  const currentKey = useMemo(() => {
    if (!profile) return "";
    if (profile.portalScope === "PROPERTY" && profile.propertyId != null) {
      return scopeKey({ scopeType: "PROPERTY", scopeId: profile.propertyId });
    }
    if (profile.portalScope === "RESTAURANT" && profile.restaurantId != null) {
      return scopeKey({ scopeType: "RESTAURANT", scopeId: profile.restaurantId });
    }
    return "";
  }, [profile]);

  useEffect(() => {
    if (!token || !isAdmin) return;
    let cancelled = false;
    listAccessibleScopes(token)
      .then((data) => {
        if (!cancelled) setScopes(data.scopes ?? []);
      })
      .catch(() => {
        if (!cancelled) setScopes([]);
      });
    return () => {
      cancelled = true;
    };
  }, [token, isAdmin]);

  const onChange = useCallback(
    async (value: string) => {
      if (!token || switching || value === currentKey) return;
      const [scopeType, idStr] = value.split(":");
      const scopeId = Number(idStr);
      if ((scopeType !== "PROPERTY" && scopeType !== "RESTAURANT") || !Number.isFinite(scopeId)) {
        return;
      }
      setSwitching(true);
      try {
        await switchActiveScope(token, { scopeType, scopeId });
        // Property-scoped state lives everywhere; a reload is the clean reset.
        window.location.reload();
      } catch {
        setSwitching(false);
      }
    },
    [token, switching, currentKey]
  );

  if (!isClient || !isAdmin || scopes.length <= 1) return null;

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-accent">
        {switching ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Building2 className="size-3.5" />
        )}
      </span>
      <select
        aria-label="Switch property or restaurant"
        value={currentKey}
        disabled={switching}
        onChange={(e) => void onChange(e.target.value)}
        className="h-10 max-w-48 appearance-none truncate rounded-full border border-border/70 bg-card/60 pl-8 pr-8 text-xs font-semibold text-foreground backdrop-blur transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-60 sm:max-w-64"
      >
        {scopes.map((scope) => {
          const key = scopeKey(scope);
          return (
            <option key={key} value={key}>
              {scope.scopeType === "RESTAURANT" ? "🍽 " : "🏨 "}
              {scope.name}
            </option>
          );
        })}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isClient = useIsClient();
  const { dark, toggle } = useTheme();
  const profile = useMemo(() => (isClient ? getPortalProfile() : null), [isClient]);
  const scope = profile?.portalScope ?? "PROPERTY";
  const ScopeIcon = scope === "RESTAURANT" ? UtensilsCrossed : Building2;

  const activeIndex = NAV.findIndex((n) => pathname?.startsWith(n.href));

  const onLogout = () => {
    clearPortalSession?.();
    router.replace("/login");
  };

  return (
    <div className="shell ambient grain relative min-h-dvh">
      {/* ---- top bar ---- */}
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="container-shell flex h-16 items-center justify-between gap-3">
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
            <BrandLogo />
            <span className="inline-flex items-center rounded-full border border-border/70 bg-card/60 px-2.5 py-1 text-[11px] font-semibold text-foreground backdrop-blur">
              Zenvana Payment
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <ScopeSwitcher isClient={isClient} />

            <span className="hidden items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground backdrop-blur sm:inline-flex">
              <ScopeIcon className="size-3.5 text-accent" />
              {scope === "RESTAURANT" ? "Restaurant" : "Property"}
            </span>

            <button
              type="button"
              onClick={toggle}
              aria-label="Toggle theme"
              className="grid size-10 place-items-center rounded-full border border-border/70 bg-card/60 text-foreground backdrop-blur transition hover:bg-muted active:scale-95"
            >
              <motion.span
                key={dark ? "moon" : "sun"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {dark ? <Moon className="size-[18px]" /> : <Sun className="size-[18px]" />}
              </motion.span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              aria-label="Log out"
              className="grid size-10 place-items-center rounded-full border border-border/70 bg-card/60 text-foreground backdrop-blur transition hover:bg-muted active:scale-95"
            >
              <LogOut className="size-[17px]" />
            </button>
          </div>
        </div>
      </header>

      {/* ---- desktop side rail + content ---- */}
      <div className="container-shell flex gap-6 py-5">
        <aside className="sticky top-24 hidden h-fit w-52 shrink-0 flex-col gap-1 lg:flex">
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                  active
                    ? "text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="rail-active"
                    className="absolute inset-0 rounded-2xl bg-accent"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                ) : null}
                <Icon className="relative size-[18px]" />
                <span className="relative">{label}</span>
              </Link>
            );
          })}
        </aside>

        <main className="min-w-0 flex-1 pad-nav lg:pb-6">{children}</main>
      </div>

      {/* ---- floating mobile bottom nav ---- */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[max(16px,env(safe-area-inset-bottom))] lg:hidden">
        <div className="relative flex gap-1 rounded-full border border-border/70 bg-card/80 p-1.5 shadow-[var(--shadow-lift)] backdrop-blur-xl">
          {activeIndex >= 0 ? (
            <motion.span
              layoutId="nav-active"
              className="absolute inset-y-1.5 rounded-full bg-accent shadow-[0_8px_20px_-8px_var(--accent)]"
              style={{ left: `${activeIndex * 50}%`, width: "calc(50% - 0px)" }}
              transition={{ type: "spring", stiffness: 360, damping: 30 }}
            />
          ) : null}
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative z-10 flex h-11 min-w-[120px] items-center justify-center gap-2 rounded-full text-[13px] font-semibold transition-colors",
                  active ? "text-accent-foreground" : "text-muted-foreground"
                )}
              >
                <Icon className="size-[18px]" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default AppShell;
