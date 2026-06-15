"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CreditCard,
  Layers,
  Loader2,
  Lock,
  ReceiptText,
  BedDouble,
} from "lucide-react";
import { AnimatedAmount, springSoft } from "@/components/motion";

/**
 * Collect-payment form rendered inside the dashboard drawer.
 *
 * Payload contract (matches the original /sessions form):
 *   { queueItemType, queueItemId, modeSelection, collectionType, amountRequested }
 * The dashboard sends this object verbatim to `apiPost("/sessions", input)`
 * and reads `input.amountRequested` for local history.
 *
 * Business rule preserved from the original:
 *   • BOTH         → amount LOCKED to the exact total due
 *   • ORDERS_ONLY  → amount LOCKED to the exact orders due
 *   • BOOKING_ONLY → amount editable (partial payments allowed)
 */

type AllowedMode = "BOOKING_ONLY" | "ORDERS_ONLY" | "BOTH";

type QuoteData = {
  queueItemType?: "BOOKING" | "ORDER";
  queueItemId?: number;
  bookingId: number | null;
  anchorOrderId: number | null;
  bookingDue: number;
  ordersDueTotal: number;
  totalDue: number;
  allowedModes?: AllowedMode[];
};

export type CreateSessionInput = {
  queueItemType?: "BOOKING" | "ORDER";
  queueItemId?: number;
  modeSelection: AllowedMode;
  collectionType: "PAYMENT_LINK" | "CHECKOUT_REDIRECT";
  amountRequested: number;
};

export type CreateSessionSubmitIntent = "SESSION_PAGE" | "RAZORPAY_DIRECT";

const MODE_META: Record<
  AllowedMode,
  { label: string; hint: string; icon: typeof Layers; due: (q: QuoteData) => number }
> = {
  BOTH: { label: "Everything", hint: "Booking + orders", icon: Layers, due: (q) => q.totalDue },
  BOOKING_ONLY: { label: "Booking", hint: "Partial allowed", icon: BedDouble, due: (q) => q.bookingDue },
  ORDERS_ONLY: { label: "Orders", hint: "F&B / order dues", icon: ReceiptText, due: (q) => q.ordersDueTotal },
};

const round = (n: number) => Math.max(0, Math.round(n));

export default function CreateSessionForm({
  quote,
  onSubmit,
}: {
  quote: QuoteData;
  onSubmit: (input: CreateSessionInput, intent: CreateSessionSubmitIntent) => Promise<void>;
}) {
  const modes: AllowedMode[] = quote.allowedModes?.length
    ? quote.allowedModes
    : ["BOOKING_ONLY", "ORDERS_ONLY", "BOTH"];
  const initialMode: AllowedMode = modes.includes("BOTH") ? "BOTH" : modes[0];

  const [mode, setMode] = useState<AllowedMode>(initialMode);
  const collectionType: CreateSessionInput["collectionType"] = "CHECKOUT_REDIRECT";
  const [submitting, setSubmitting] = useState(false);
  // Editable amount only ever applies to BOOKING_ONLY (partial payments).
  const [bookingStr, setBookingStr] = useState(String(round(quote.bookingDue)));

  const editable = mode === "BOOKING_ONLY";
  const modeDue = round(MODE_META[mode].due(quote));
  const bookingAmt = round(Number(bookingStr.replace(/[^\d.]/g, "")) || 0);
  const amount = editable ? bookingAmt : modeDue; // locked modes always use exact due
  const overBooking = editable && amount > round(quote.bookingDue);
  const valid = amount > 0 && !overBooking && !submitting;

  const submit = async (intent: CreateSessionSubmitIntent) => {
    if (!valid) return;
    setSubmitting(true);
    try {
      await onSubmit(
        {
          queueItemType: quote.queueItemType,
          queueItemId: quote.queueItemId,
          modeSelection: mode,
          collectionType,
          amountRequested: amount,
        },
        intent
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* animated quote summary */}
      <div className="brand-gradient relative overflow-hidden rounded-3xl p-5 text-white shadow-[var(--shadow-lift,0_24px_50px_-30px_rgba(0,31,63,0.6))]">
        <div className="absolute -right-8 -top-10 size-32 rounded-full bg-white/10 blur-2xl" />
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/70">Payable now</p>
        <AnimatedAmount value={amount} className="mt-1 block text-4xl font-semibold tracking-tight" />
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-white/75">
          <span>Booking ₹{round(quote.bookingDue).toLocaleString("en-IN")}</span>
          <span>Orders ₹{round(quote.ordersDueTotal).toLocaleString("en-IN")}</span>
          <span>Total ₹{round(quote.totalDue).toLocaleString("en-IN")}</span>
        </div>
      </div>

      {/* mode segmented control */}
      {modes.length > 1 ? (
        <div>
          <label className="field-label mb-1.5 block">Collect for</label>
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${modes.length}, minmax(0,1fr))` }}
          >
            {modes.map((m) => {
              const Icon = MODE_META[m].icon;
              const active = mode === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`relative flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition ${active ? "border-accent bg-accent/10" : "border-input bg-card/60 hover:border-accent/50"
                    }`}
                >
                  {active ? (
                    <motion.span
                      layoutId="mode-glow"
                      transition={springSoft}
                      className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-accent/40"
                    />
                  ) : null}
                  <Icon className={`size-[18px] ${active ? "text-accent-foreground" : "text-muted-foreground"}`} />
                  <span className="text-sm font-semibold">{MODE_META[m].label}</span>
                  <span className="text-[11px] text-muted-foreground">{MODE_META[m].hint}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* amount — locked for BOTH / ORDERS_ONLY, editable for BOOKING_ONLY */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="field-label">Amount</label>
          {editable && amount !== round(quote.bookingDue) ? (
            <button
              type="button"
              onClick={() => setBookingStr(String(round(quote.bookingDue)))}
              className="text-[11px] font-medium text-accent-foreground/80 underline-offset-2 hover:underline"
            >
              Reset to ₹{round(quote.bookingDue).toLocaleString("en-IN")}
            </button>
          ) : null}
        </div>

        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base font-semibold text-muted-foreground">
            ₹
          </span>
          <input
            inputMode="decimal"
            disabled={!editable}
            value={editable ? bookingStr : String(modeDue)}
            onChange={(e) => setBookingStr(e.target.value)}
            onFocus={(e) => requestAnimationFrame(() => e.target.select())}
            aria-label="Amount"
            className={`tnum h-13 w-full rounded-2xl border pl-9 pr-11 text-lg font-semibold text-foreground outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/20 ${editable ? "border-input bg-card/70" : "cursor-not-allowed border-input/70 bg-muted/60 opacity-80"
              }`}
          />
          {!editable ? (
            <Lock className="pointer-events-none absolute right-4 top-1/2 size-[15px] -translate-y-1/2 text-muted-foreground" />
          ) : null}
        </div>

        <p className="mt-1.5 text-xs text-muted-foreground">
          {editable
            ? overBooking
              ? `Cannot exceed booking due of ₹${round(quote.bookingDue).toLocaleString("en-IN")}.`
              : `Partial amount allowed · due ₹${round(quote.bookingDue).toLocaleString("en-IN")}.`
            : `Locked to the exact ${MODE_META[mode].label.toLowerCase()} due for ${mode} mode.`}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => void submit("SESSION_PAGE")}
          disabled={!valid}
          className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-accent py-3.5 text-[15px] font-semibold text-accent-foreground shadow-[0_14px_30px_-14px_var(--accent)] transition hover:brightness-105 disabled:opacity-60 sm:order-2"
        >
          {submitting ? (
            <>
              <Loader2 className="size-[18px] animate-spin" /> Creating session…
            </>
          ) : (
            <>
              <span className="sm:hidden">Continue to checkout</span>
              <span className="hidden sm:inline">Show QR &amp; link</span>
              <ArrowRight className="size-[18px]" />
            </>
          )}
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => void submit("RAZORPAY_DIRECT")}
          disabled={!valid}
          className="hidden h-13 w-full items-center justify-center gap-2 rounded-full border border-accent/50 bg-card/80 py-3.5 text-[15px] font-semibold text-accent-foreground transition hover:border-accent hover:bg-accent/10 disabled:opacity-60 sm:inline-flex sm:order-1"
        >
          {submitting ? (
            <>
              <Loader2 className="size-[18px] animate-spin" /> Opening Razorpay…
            </>
          ) : (
            <>
              <CreditCard className="size-[18px]" />
              Open Razorpay
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
