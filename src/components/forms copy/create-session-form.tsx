"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CreditCard,
  Layers,
  Link2,
  Loader2,
  ReceiptText,
  BedDouble,
} from "lucide-react";
import { AnimatedAmount, springSoft } from "@/components/motion";

/**
 * Collect-payment form rendered inside the dashboard drawer.
 *
 * IMPORTANT — payload contract:
 * The object emitted by `onSubmit` is sent verbatim to your `/sessions`
 * endpoint (the dashboard does `apiPost("/sessions", input)`), and the
 * dashboard also reads `input.amountRequested` for local history.
 * The fields below are a sensible default shape — adjust `SessionCreateInput`
 * and the `submit()` payload to match your existing backend contract.
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
  allowedModes: AllowedMode[];
};

export type SessionCreateInput = {
  queueItemType?: "BOOKING" | "ORDER";
  queueItemId?: number;
  bookingId: number | null;
  anchorOrderId: number | null;
  mode: AllowedMode;
  amountRequested: number;
  method: "CHECKOUT_REDIRECT" | "PAYMENT_LINK";
};

const MODE_META: Record<
  AllowedMode,
  { label: string; hint: string; icon: typeof Layers; due: (q: QuoteData) => number }
> = {
  BOTH: { label: "Everything", hint: "Booking + orders", icon: Layers, due: (q) => q.totalDue },
  BOOKING_ONLY: { label: "Booking", hint: "Room dues only", icon: BedDouble, due: (q) => q.bookingDue },
  ORDERS_ONLY: { label: "Orders", hint: "F&B / order dues", icon: ReceiptText, due: (q) => q.ordersDueTotal },
};

const METHODS: Array<{
  value: SessionCreateInput["method"];
  label: string;
  hint: string;
  icon: typeof CreditCard;
}> = [
  { value: "CHECKOUT_REDIRECT", label: "Checkout", hint: "Collect now on this device", icon: CreditCard },
  { value: "PAYMENT_LINK", label: "Payment link", hint: "Share with the guest", icon: Link2 },
];

export default function CreateSessionForm({
  quote,
  onSubmit,
}: {
  quote: QuoteData;
  onSubmit: (input: SessionCreateInput) => void | Promise<void>;
}) {
  const modes = quote.allowedModes?.length ? quote.allowedModes : (["BOTH"] as AllowedMode[]);
  const [mode, setMode] = useState<AllowedMode>(modes[0]);
  const [method, setMethod] = useState<SessionCreateInput["method"]>("CHECKOUT_REDIRECT");
  const [submitting, setSubmitting] = useState(false);
  // null means "follow the selected mode's due"; a string means manual override
  const [override, setOverride] = useState<string | null>(null);

  const modeDue = useMemo(() => Math.max(0, Math.round(MODE_META[mode].due(quote))), [mode, quote]);
  const amount = override === null ? modeDue : Number(override.replace(/[^\d.]/g, "")) || 0;
  const valid = amount > 0 && !submitting;

  const submit = async () => {
    if (!valid) return;
    setSubmitting(true);
    try {
      await onSubmit({
        queueItemType: quote.queueItemType,
        queueItemId: quote.queueItemId,
        bookingId: quote.bookingId,
        anchorOrderId: quote.anchorOrderId,
        mode,
        amountRequested: amount,
        method,
      });
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
          <span>Booking due ₹{Math.round(quote.bookingDue).toLocaleString("en-IN")}</span>
          <span>Orders due ₹{Math.round(quote.ordersDueTotal).toLocaleString("en-IN")}</span>
          <span>Total ₹{Math.round(quote.totalDue).toLocaleString("en-IN")}</span>
        </div>
      </div>

      {/* mode segmented control */}
      {modes.length > 1 ? (
        <div>
          <label className="field-label mb-1.5 block">Collect for</label>
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${modes.length}, minmax(0,1fr))` }}>
            {modes.map((m) => {
              const Icon = MODE_META[m].icon;
              const active = mode === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setOverride(null);
                  }}
                  className={`relative flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition ${
                    active
                      ? "border-accent bg-accent/10"
                      : "border-input bg-card/60 hover:border-accent/50"
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

      {/* amount */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="field-label">Amount</label>
          {override !== null && amount !== modeDue ? (
            <button
              type="button"
              onClick={() => setOverride(null)}
              className="text-[11px] font-medium text-accent-foreground/80 underline-offset-2 hover:underline"
            >
              Reset to ₹{modeDue.toLocaleString("en-IN")}
            </button>
          ) : null}
        </div>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base font-semibold text-muted-foreground">
            ₹
          </span>
          <input
            inputMode="decimal"
            value={override === null ? String(modeDue) : override}
            onChange={(e) => setOverride(e.target.value)}
            onFocus={(e) => {
              if (override === null) setOverride(String(modeDue));
              requestAnimationFrame(() => e.target.select());
            }}
            className="tnum h-13 w-full rounded-2xl border border-input bg-card/70 pl-9 pr-4 text-lg font-semibold text-foreground outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/20"
          />
        </div>
      </div>

      {/* method */}
      <div>
        <label className="field-label mb-1.5 block">How to collect</label>
        <div className="grid grid-cols-2 gap-2">
          {METHODS.map((opt) => {
            const Icon = opt.icon;
            const active = method === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMethod(opt.value)}
                className={`relative flex flex-col items-start gap-1.5 rounded-2xl border p-3.5 text-left transition ${
                  active ? "border-accent bg-accent/10" : "border-input bg-card/60 hover:border-accent/50"
                }`}
              >
                {active ? (
                  <motion.span
                    layoutId="method-glow"
                    transition={springSoft}
                    className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-accent/40"
                  />
                ) : null}
                <Icon className={`size-5 ${active ? "text-accent-foreground" : "text-muted-foreground"}`} />
                <span className="text-sm font-semibold">{opt.label}</span>
                <span className="text-[11px] leading-tight text-muted-foreground">{opt.hint}</span>
              </button>
            );
          })}
        </div>
      </div>

      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={() => void submit()}
        disabled={!valid}
        className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-accent py-3.5 text-[15px] font-semibold text-accent-foreground shadow-[0_14px_30px_-14px_var(--accent)] transition hover:brightness-105 disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="size-[18px] animate-spin" /> Creating session…
          </>
        ) : (
          <>
            {method === "PAYMENT_LINK" ? "Generate payment link" : "Continue to checkout"}
            <ArrowRight className="size-[18px]" />
          </>
        )}
      </motion.button>
    </div>
  );
}
