"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCcw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getPortalToken } from "@/lib/auth";
import { getSessionHistory } from "@/lib/session-history";
import { getSessionById, type PaymentSession } from "@/lib/sessions";
import { SessionStatusChip } from "@/components/session-status-chip";
import { useIsClient } from "@/lib/use-is-client";

type SessionListItem = PaymentSession & {
  historyCreatedAt: string;
};

function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export default function SessionsPage() {
  const router = useRouter();
  const isClient = useIsClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [query, setQuery] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);
  const token = isClient ? getPortalToken() : null;

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }

    let closed = false;
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const history = getSessionHistory();
        if (!history.length) {
          if (!closed) setSessions([]);
          return;
        }

        const results = await Promise.all(
          history.map(async (item) => {
            try {
              const session = await getSessionById(item.id, token);
              return {
                ...session,
                historyCreatedAt: item.createdAt,
              } satisfies SessionListItem;
            } catch {
              return null;
            }
          })
        );

        const resolved = results.filter((item): item is SessionListItem => Boolean(item));
        if (!closed) setSessions(resolved);
      } catch (err: unknown) {
        if (!closed) setError(getErrorMessage(err, "Failed to load session history"));
      } finally {
        if (!closed) setLoading(false);
      }
    };

    void load();
    return () => {
      closed = true;
    };
  }, [router, refreshTick, token]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((session) => {
      return (
        String(session.id).includes(q) ||
        session.status.toLowerCase().includes(q) ||
        String(session.razorpayOrderId ?? "").toLowerCase().includes(q)
      );
    });
  }, [sessions, query]);

  if (!isClient || !token) return null;

  return (
    <section className="space-y-4 pb-2">
      <div className="quiet-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="field-label">History</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Past Sessions</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sessions created by this logged-in user on this device.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-full"
            onClick={() => setRefreshTick((value) => value + 1)}
          >
            <RefreshCcw className="size-3.5" />
            Refresh
          </Button>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              aria-label="Search sessions"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by session id, status, order id"
              className="h-10 rounded-xl pl-9"
            />
          </div>
        </div>
      </div>

      {error ? (
        <div className="quiet-card border-destructive/40 p-4 text-sm text-destructive">{error}</div>
      ) : null}

      {loading ? (
        <div className="quiet-card p-4 text-sm text-muted-foreground">Loading session history...</div>
      ) : null}

      {!loading && !filtered.length ? (
        <div className="quiet-card p-6 text-center">
          <h2 className="text-lg font-semibold">No sessions yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a payment session from dashboard, then it will appear here.
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-flex rounded-full border border-border/70 bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Go to dashboard
          </Link>
        </div>
      ) : null}

      <div className="grid gap-3">
        {filtered.map((session) => (
          <article key={session.id} className="quiet-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="field-label">Session</p>
                <h3 className="text-lg font-semibold">#{session.id}</h3>
              </div>
              <SessionStatusChip status={session.status} />
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-muted-foreground">Requested</dt>
                <dd className="font-medium">₹{session.amountRequested}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Captured</dt>
                <dd className="font-medium">₹{session.amountCaptured ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Applied</dt>
                <dd className="font-medium">₹{session.amountApplied ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Created</dt>
                <dd className="font-medium">
                  {new Date(session.historyCreatedAt).toLocaleString("en-IN")}
                </dd>
              </div>
            </dl>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Link
                href={`/payment/${session.id}`}
                className="inline-flex rounded-full border border-border/70 bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
              >
                Open session
              </Link>
              {session.razorpayPayloadJson?.short_url ? (
                <a
                  href={session.razorpayPayloadJson.short_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-full border border-border/70 bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                >
                  Open payment link
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
