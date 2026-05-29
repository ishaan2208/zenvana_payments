// dashboard/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCcw, X } from "lucide-react";
import CreateSessionForm from "@/components/forms/create-session-form";
import { apiGet, apiPost } from "@/lib/api-client";
import { getPortalProfile, getPortalToken } from "@/lib/auth";
import { addSessionHistory } from "@/lib/session-history";
import { useIsClient } from "@/lib/use-is-client";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

type QuoteData = {
  queueItemType?: "BOOKING" | "ORDER";
  queueItemId?: number;
  bookingId: number | null;
  anchorOrderId: number | null;
  bookingDue: number;
  ordersDueTotal: number;
  totalDue: number;
  allowedModes: Array<"BOOKING_ONLY" | "ORDERS_ONLY" | "BOTH">;
};

type QueueItem = {
  queueItemType: "BOOKING" | "ORDER";
  queueItemId: number;
  guestName: string;
  guestPhoneNumber?: string;
  bookingStatus?: "UPCOMING" | "INHOUSE";
  bookingReference?: string;
  orderReference?: string;
  bookingDue: number;
  ordersDueTotal: number;
  totalDue: number;
  pendingOrderCount?: number;
  roomNumber?: string | null;
  tableId?: number | null;
  createdAt: string;
};

type QueueResponse = {
  portalScope: "PROPERTY" | "RESTAURANT";
  queue: QueueItem[];
};

type SessionCreateResponse = {
  session: { id: number; status: string };
  razorpay: {
    mode: "CHECKOUT_REDIRECT" | "PAYMENT_LINK";
    keyId?: string;
    orderId?: string;
    amount?: number;
    currency?: string;
    paymentLinkUrl?: string;
  };
};

const RAZORPAY_CHECKOUT_JS = "https://checkout.razorpay.com/v1/checkout.js";

function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

async function ensureRazorpayLoaded(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (window.Razorpay) return true;

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_CHECKOUT_JS;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout script"));
    document.body.appendChild(script);
  });

  return Boolean(window.Razorpay);
}

export default function DashboardPage() {
  const router = useRouter();
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [queueLoading, setQueueLoading] = useState(true);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [queueScope, setQueueScope] = useState<"PROPERTY" | "RESTAURANT" | null>(null);
  const [activeQueueItem, setActiveQueueItem] = useState<QueueItem | null>(null);
  const [quoteSheetOpen, setQuoteSheetOpen] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const isClient = useIsClient();
  const token = useMemo(() => (isClient ? getPortalToken() : null), [isClient]);
  const profile = useMemo(() => (isClient ? getPortalProfile() : null), [isClient]);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [router, token]);

  const loadQueue = useCallback(async (showLoading: boolean, resetError: boolean) => {
    if (!token) return;
    if (showLoading) setQueueLoading(true);
    if (resetError) setError(null);
    try {
      const data = await apiGet<QueueResponse>("/queue", token);
      setQueueScope(data.portalScope);
      setQueue(data.queue);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load collection queue"));
    } finally {
      setQueueLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadQueue(false, false);
  }, [loadQueue]);

  const openQuoteForQueueItem = async (item: QueueItem) => {
    if (!token) return;
    setError(null);
    setQuote(null);
    setActiveQueueItem(item);
    setQuoteSheetOpen(true);
    setQuoteLoading(true);
    try {
      const quoteData = await apiPost<QuoteData>(
        "/quote",
        {
          queueItemType: item.queueItemType,
          queueItemId: item.queueItemId,
        },
        token ?? undefined
      );
      setQuote(quoteData);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load payable quote"));
    } finally {
      setQuoteLoading(false);
    }
  };

  useEffect(() => {
    if (!quoteSheetOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setQuoteSheetOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [quoteSheetOpen]);

  if (!isClient || !token) return null;

  return (
    <section className="space-y-4 pb-2">
      <div className="quiet-card p-4 sm:p-5">
        <p className="field-label">Payments</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Collect Payment</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          No manual IDs. Pick a pending item from your live collection queue.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            Scope: {queueScope ?? profile?.portalScope ?? "UNKNOWN"}
          </span>
          <button
            type="button"
            onClick={() => void loadQueue(true, true)}
            className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-medium text-foreground hover:bg-muted"
          >
            <RefreshCcw className="size-3.5" />
            Refresh queue
          </button>
        </div>
      </div>

      <div className="quiet-card p-4 sm:p-5">
        <div className="mb-3">
          <p className="field-label">Queue</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">
            {queueScope === "RESTAURANT"
              ? "Open unpaid orders"
              : "Upcoming/Inhouse bookings with pending dues"}
          </h2>
        </div>

        {queueLoading ? (
          <p className="text-sm text-muted-foreground">Loading queue...</p>
        ) : null}

        {!queueLoading && !queue.length ? (
          <p className="text-sm text-muted-foreground">No pending collections right now.</p>
        ) : null}

        <div className="grid gap-3">
          {queue.map((item) => (
            <article key={`${item.queueItemType}-${item.queueItemId}`} className="rounded-2xl border border-border/70 bg-background p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    {item.queueItemType} #{item.queueItemId}
                  </p>
                  <h3 className="mt-1 text-base font-semibold">{item.guestName || "Guest"}</h3>
                  <p className="text-xs text-muted-foreground">
                    {item.bookingReference ? `Booking: ${item.bookingReference}` : ""}
                    {item.orderReference ? ` Order: ${item.orderReference}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total due</p>
                  <p className="text-lg font-semibold">₹{item.totalDue}</p>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {item.bookingStatus ? <span>Status: {item.bookingStatus}</span> : null}
                {item.pendingOrderCount ? <span>Pending orders: {item.pendingOrderCount}</span> : null}
                {item.roomNumber ? <span>Room: {item.roomNumber}</span> : null}
                {item.tableId ? <span>Table: {item.tableId}</span> : null}
              </div>
              <button
                type="button"
                onClick={() => void openQuoteForQueueItem(item)}
                className="mt-3 inline-flex rounded-full border border-primary/30 bg-primary/12 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-primary/20"
              >
                Collect
              </button>
            </article>
          ))}
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {quoteSheetOpen ? (
        <>
          <button
            type="button"
            aria-label="Close collect sheet backdrop"
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm"
            onClick={() => setQuoteSheetOpen(false)}
          />
          <aside className="fixed right-0 top-0 z-50 h-dvh w-full max-w-[560px] border-l border-border/70 bg-background p-4 shadow-2xl sm:p-5">
            <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
              <div>
                <p className="field-label">Collect payment</p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">
                  {activeQueueItem
                    ? `${activeQueueItem.queueItemType} #${activeQueueItem.queueItemId}`
                    : "Create session"}
                </h2>
                {activeQueueItem ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Total due: ₹{activeQueueItem.totalDue}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setQuoteSheetOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-card text-foreground hover:bg-muted"
                aria-label="Close collect sheet"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 max-h-[calc(100dvh-7rem)] overflow-y-auto pr-1">
              {quoteLoading ? (
                <div className="quiet-card p-4 text-sm text-muted-foreground">
                  Loading quote details...
                </div>
              ) : null}

              {!quoteLoading && quote ? (
                <CreateSessionForm
                  quote={quote}
                  onSubmit={async (input) => {
                    setError(null);
                    try {
                      const result = await apiPost<SessionCreateResponse>(
                        "/sessions",
                        input,
                        token ?? undefined
                      );
                      setQuote(null);
                      setActiveQueueItem(null);
                      setQuoteSheetOpen(false);
                      void loadQueue(true, false);
                      addSessionHistory({
                        id: result.session.id,
                        createdAt: new Date().toISOString(),
                        amountRequested: input.amountRequested,
                      });
                      if (
                        result.razorpay.mode === "CHECKOUT_REDIRECT" &&
                        result.razorpay.keyId &&
                        result.razorpay.orderId &&
                        result.razorpay.amount &&
                        result.razorpay.currency
                      ) {
                        const loaded = await ensureRazorpayLoaded();
                        if (!loaded || !window.Razorpay) {
                          throw new Error("Razorpay checkout is unavailable");
                        }

                        const checkout = new window.Razorpay({
                          key: result.razorpay.keyId,
                          amount: result.razorpay.amount,
                          currency: result.razorpay.currency,
                          order_id: result.razorpay.orderId,
                          name: "Zenvana Payments",
                          description: `Session #${result.session.id}`,
                          handler: () => {
                            router.push(`/payment/${result.session.id}`);
                          },
                          modal: {
                            ondismiss: () => {
                              router.push(`/payment/${result.session.id}`);
                            },
                          },
                        });
                        checkout.open();
                        return;
                      }

                      if (result.razorpay.mode === "PAYMENT_LINK" && result.razorpay.paymentLinkUrl) {
                        router.push(
                          `/payment/${result.session.id}?paymentLink=${encodeURIComponent(
                            result.razorpay.paymentLinkUrl
                          )}`
                        );
                        return;
                      }
                      router.push(`/payment/${result.session.id}`);
                    } catch (err: unknown) {
                      setError(getErrorMessage(err, "Failed to create session"));
                    }
                  }}
                />
              ) : null}

              {!quoteLoading && !quote ? (
                <div className="quiet-card p-4 text-sm text-muted-foreground">
                  Unable to load quote for this item. Please close and try again.
                </div>
              ) : null}
            </div>
          </aside>
        </>
      ) : null}
    </section>
  );
}
