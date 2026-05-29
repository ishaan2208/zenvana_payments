"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Receipt, Inbox } from "lucide-react";
import { getPortalToken } from "@/lib/auth";
import SessionStatusChip from "@/components/session-status-chip";
import { getMySessions, type PaymentSession } from "@/lib/sessions";
import { useIsClient } from "@/lib/use-is-client";
import { FadeIn, Stagger, StaggerItem, AnimatedAmount } from "@/components/motion";

function createdLabel(isoDate?: string) {
  if (!isoDate) return "Created recently";
  const parsed = Date.parse(isoDate);
  if (Number.isNaN(parsed)) return "Created recently";
  return new Date(parsed).toLocaleString("en-IN", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// status → accent rail colour (uses existing theme vars)
function railTone(status: string) {
  const s = status.toUpperCase();
  if (s.includes("CAPTUR") || s === "PAID" || s.includes("APPLIED")) return "var(--success)";
  if (s.includes("FAIL") || s.includes("CANCEL")) return "var(--destructive)";
  if (s.includes("PEND") || s.includes("CREATED")) return "var(--accent)";
  return "var(--chart-3)";
}

export default function SessionsPage() {
  const router = useRouter();
  const isClient = useIsClient();
  const token = isClient ? getPortalToken() : null;
  const [sessions, setSessions] = useState<PaymentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }

    let cancelled = false;
    const load = async () => {
      setError(null);
      try {
        const data = await getMySessions(token);
        if (!cancelled) setSessions(data);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load sessions");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [router, token]);

  // presentational summary derived from fetched data (no logic change)
  const totalCaptured = useMemo(
    () => sessions.reduce((sum, s) => sum + (s.amountCaptured ?? 0), 0),
    [sessions]
  );

  if (!isClient || !token) return null;

  return (
    <section className="mx-auto w-full max-w-2xl space-y-5">
      {/* header card */}
      <FadeIn>
        <div className="quiet-card p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="grid size-9 shrink-0 place-items-center rounded-full border border-border/70 bg-card/60 text-foreground backdrop-blur transition hover:bg-muted active:scale-95"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="size-4" />
            </button>
            <div className="min-w-0">
              <p className="eyebrow">Sessions</p>
              <h1 className="display mt-0.5 text-xl sm:text-2xl">Session history</h1>
            </div>
          </div>

          {!loading && sessions.length > 0 ? (
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border/60 bg-card/60 px-4 py-3">
                <p className="eyebrow">Sessions</p>
                <span className="display mt-1.5 block text-2xl tnum">{sessions.length}</span>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/60 px-4 py-3">
                <p className="eyebrow">Total captured</p>
                <AnimatedAmount value={totalCaptured} className="display mt-1.5 block text-2xl" />
              </div>
            </div>
          ) : null}
        </div>
      </FadeIn>

      {error ? (
        <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {/* loading skeletons */}
      {loading ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[120px] animate-pulse rounded-3xl border border-border/50 bg-card/50"
            />
          ))}
        </div>
      ) : null}

      {/* empty state */}
      {!loading && sessions.length === 0 ? (
        <FadeIn>
          <div className="quiet-card flex flex-col items-center gap-3 p-10 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-accent/15 text-accent-foreground">
              <Inbox className="size-5" />
            </span>
            <div>
              <h3 className="display text-base">No sessions yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Collected payments will appear here. Start one from the dashboard.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="mt-1 inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground shadow-[0_14px_30px_-14px_var(--accent)] transition hover:brightness-105"
            >
              Go to dashboard <ArrowRight className="size-4" />
            </Link>
          </div>
        </FadeIn>
      ) : null}

      {/* session list */}
      {!loading && sessions.length > 0 ? (
        <Stagger className="grid gap-3">
          {sessions.map((session) => {
            const requested = session.amountRequested ?? 0;
            const captured = session.amountCaptured ?? 0;
            const applied = session.amountApplied;
            const status = session.status ?? "CREATED";

            return (
              <StaggerItem
                key={session.id}
                className="group relative overflow-hidden rounded-3xl border border-border/70 bg-card/85 shadow-[0_12px_28px_-24px_rgba(0,31,63,0.5)] backdrop-blur transition hover:border-accent/40 hover:shadow-[var(--shadow-card)]"
              >
                {/* status accent rail */}
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-1"
                  style={{ backgroundColor: railTone(status) }}
                />

                <Link href={`/payment/${session.id}`} className="block px-4 py-4 pl-5 sm:px-5 sm:pl-6">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-9 place-items-center rounded-xl bg-muted/70 text-muted-foreground">
                        <Receipt className="size-[18px]" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold">Session #{session.id}</p>
                        <p className="text-xs text-muted-foreground">{createdLabel(session.createdAt)}</p>
                      </div>
                    </div>
                    <SessionStatusChip status={status} />
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground">Requested</p>
                      <p className="tnum mt-0.5 text-sm font-semibold">₹{requested.toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Captured</p>
                      <p className="tnum mt-0.5 text-sm font-semibold">₹{captured.toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Applied</p>
                      <p className="tnum mt-0.5 text-sm font-semibold">
                        {applied != null ? `₹${applied.toLocaleString("en-IN")}` : "—"}
                      </p>
                    </div>
                  </div>

                  <span className="pointer-events-none absolute bottom-4 right-4 inline-flex size-7 items-center justify-center rounded-full bg-accent/10 text-accent-foreground opacity-0 transition group-hover:opacity-100 sm:bottom-5 sm:right-5">
                    <ArrowRight className="size-4" />
                  </span>
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>
      ) : null}
    </section>
  );
}