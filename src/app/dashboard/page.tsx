"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCcw,
  X,
  ArrowRight,
  BedDouble,
  Utensils,
  Inbox,
  Wallet,
  Layers,
} from "lucide-react";
import CreateSessionForm from "@/components/forms/create-session-form";
import { apiGet, apiPost } from "@/lib/api-client";
import { getPortalProfile, getPortalToken } from "@/lib/auth";
import { addSessionHistory } from "@/lib/session-history";
import { useIsClient } from "@/lib/use-is-client";
import { AnimatedAmount, Stagger, StaggerItem } from "@/components/motion";

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

function inr(n: number) {
  return n.toLocaleString("en-IN");
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

/* mobile = bottom sheet, desktop = right drawer */
function useIsDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const on = () => setDesktop(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return desktop;
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
  const isDesktop = useIsDesktop();
  const token = useMemo(() => (isClient ? getPortalToken() : null), [isClient]);
  const profile = useMemo(() => (isClient ? getPortalProfile() : null), [isClient]);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [router, token]);

  const loadQueue = useCallback(
    async (showLoading: boolean, resetError: boolean) => {
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
    },
    [token]
  );

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
      if (event.key === "Escape") setQuoteSheetOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [quoteSheetOpen]);

  const scope = queueScope ?? profile?.portalScope ?? "PROPERTY";
  const totals = useMemo(
    () => ({
      due: queue.reduce((s, q) => s + (q.totalDue || 0), 0),
      count: queue.length,
    }),
    [queue]
  );

  if (!isClient || !token) return null;

  return (
    <section className="space-y-5">
      {/* ---- header ---- */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="quiet-card p-5 sm:p-6"
      >
        <p className="eyebrow">Payments</p>
        <h1 className="display mt-1.5 text-[27px] sm:text-3xl">Collect Payment</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          No manual IDs. Pick a pending item from your live collection queue.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wallet className="size-4 text-accent" />
              <span className="text-[11px] uppercase tracking-[0.12em]">Pending dues</span>
            </div>
            <AnimatedAmount value={totals.due} className="display mt-2 block text-2xl" />
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Layers className="size-4 text-accent" />
              <span className="text-[11px] uppercase tracking-[0.12em]">Open items</span>
            </div>
            <span className="display mt-2 block text-2xl tnum">{totals.count}</span>
          </div>
        </div>
      </motion.div>

      {/* ---- queue ---- */}
      <div>
        <div className="mb-3 flex items-end justify-between px-1">
          <div>
            <p className="eyebrow">Queue</p>
            <h2 className="display mt-1 text-lg">
              {scope === "RESTAURANT" ? "Open unpaid orders" : "Upcoming / in-house with dues"}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => void loadQueue(true, true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-3.5 text-xs font-semibold text-foreground backdrop-blur transition hover:bg-muted active:scale-95"
          >
            <RefreshCcw className={`size-3.5 ${queueLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {queueLoading ? (
          <div className="grid gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[132px] animate-pulse rounded-3xl border border-border/50 bg-card/50" />
            ))}
          </div>
        ) : null}

        {!queueLoading && !queue.length ? (
          <div className="quiet-card flex flex-col items-center gap-3 p-10 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
              <Inbox className="size-6" />
            </span>
            <div>
              <h3 className="display text-base">All clear</h3>
              <p className="mt-1 text-sm text-muted-foreground">No pending collections right now.</p>
            </div>
          </div>
        ) : null}

        <Stagger className="grid gap-3">
          {queue.map((item) => {
            const isOrder = item.queueItemType === "ORDER";
            return (
              <StaggerItem
                key={`${item.queueItemType}-${item.queueItemId}`}
                onClick={() => void openQuoteForQueueItem(item)}
                className="group relative cursor-pointer overflow-hidden rounded-3xl border border-border/70 bg-card/85 p-4 shadow-[0_12px_28px_-24px_rgba(0,31,63,0.5)] backdrop-blur transition hover:border-accent/40 hover:shadow-[var(--shadow-card)] sm:p-5"
              >
                <span
                  className={`absolute inset-y-4 left-0 w-[3px] rounded-full ${isOrder ? "bg-chart-3" : "bg-accent"
                    }`}
                />
                <div className="flex items-start justify-between gap-3 pl-3">
                  <div className="min-w-0">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                      <span className={`size-1.5 rounded-full ${isOrder ? "bg-chart-3" : "bg-accent"}`} />
                      {item.queueItemType} #{item.queueItemId}
                    </span>
                    <h3 className="display mt-1 truncate text-lg">{item.guestName || "Guest"}</h3>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {item.bookingReference ? `Booking ${item.bookingReference}` : ""}
                      {item.bookingReference && item.orderReference ? " · " : ""}
                      {item.orderReference ? `Order ${item.orderReference}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">Total due</p>
                    <p className="display text-xl tnum">₹{inr(item.totalDue)}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 pl-3">
                  {item.bookingStatus ? (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-medium ${item.bookingStatus === "INHOUSE"
                        ? "bg-success/12 text-success"
                        : "bg-chart-3/12 text-chart-3"
                        }`}
                    >
                      {item.bookingStatus === "INHOUSE" ? "In-house" : "Upcoming"}
                    </span>
                  ) : null}
                  {item.roomNumber ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[10.5px] text-muted-foreground">
                      <BedDouble className="size-3" /> Room {item.roomNumber}
                    </span>
                  ) : null}
                  {item.tableId ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[10.5px] text-muted-foreground">
                      <Utensils className="size-3" /> Table {item.tableId}
                    </span>
                  ) : null}
                  {item.pendingOrderCount ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[10.5px] text-muted-foreground">
                      {item.pendingOrderCount} pending order{item.pendingOrderCount > 1 ? "s" : ""}
                    </span>
                  ) : null}
                </div>

                <div className="mt-3.5 flex items-center justify-between pl-3">
                  <span className="text-[11.5px] text-muted-foreground">
                    {isOrder ? "Restaurant" : "Property"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-2 text-xs font-semibold text-accent-foreground">
                    Collect
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>

      {error ? (
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </motion.p>
      ) : null}

      {/* ---- collect drawer (bottom sheet on mobile / right drawer on desktop) ---- */}
      <AnimatePresence>
        {quoteSheetOpen ? (
          <>
            <motion.button
              type="button"
              aria-label="Close collect sheet"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-[rgba(2,8,20,0.5)] backdrop-blur-sm"
              onClick={() => setQuoteSheetOpen(false)}
            />
            <motion.aside
              initial={isDesktop ? { x: "100%" } : { y: "100%" }}
              animate={isDesktop ? { x: 0 } : { y: 0 }}
              exit={isDesktop ? { x: "100%" } : { y: "100%" }}
              transition={{ type: "spring", stiffness: 360, damping: 38 }}
              className="fixed z-50 flex flex-col border-border/70 bg-card shadow-[var(--shadow-lift)]
                         inset-x-0 bottom-0 max-h-[90dvh] rounded-t-[30px] border-t
                         sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:h-dvh sm:w-full sm:max-w-[560px] sm:rounded-none sm:rounded-l-[28px] sm:border-l sm:border-t-0"
            >
              <div className="mx-auto mt-3 h-1.5 w-11 rounded-full bg-border sm:hidden" />
              <div className="flex items-start justify-between gap-3 border-b border-border/60 px-5 pb-4 pt-3 sm:px-6">
                <div>
                  <p className="eyebrow">Collect payment</p>
                  <h2 className="display mt-1 text-lg">
                    {activeQueueItem
                      ? `${activeQueueItem.queueItemType} #${activeQueueItem.queueItemId}`
                      : "Create session"}
                  </h2>
                  {activeQueueItem ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Total due ₹{inr(activeQueueItem.totalDue)}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setQuoteSheetOpen(false)}
                  className="grid size-9 place-items-center rounded-full border border-border/70 bg-card text-foreground transition hover:bg-muted active:scale-95"
                  aria-label="Close"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="overflow-y-auto px-5 py-5 sm:px-6">
                {quoteLoading ? (
                  <div className="space-y-3">
                    <div className="h-28 animate-pulse rounded-3xl bg-muted" />
                    <div className="h-14 animate-pulse rounded-2xl bg-muted" />
                    <div className="h-14 animate-pulse rounded-2xl bg-muted" />
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

                        if (
                          result.razorpay.mode === "PAYMENT_LINK" &&
                          result.razorpay.paymentLinkUrl
                        ) {
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
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
