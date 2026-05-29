"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Copy, Loader2 } from "lucide-react";
import Image from "next/image";
import QRCode from "qrcode";
import { apiGet } from "@/lib/api-client";
import { getPortalToken } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { useIsClient } from "@/lib/use-is-client";
import { AnimatedAmount } from "@/components/motion";

type SessionData = {
  id: number;
  status: string;
  amountRequested: number;
  amountCaptured: number | null;
  amountApplied: number | null;
  razorpayOrderId: string | null;
  razorpayPaymentLinkId: string | null;
  razorpayPayloadJson?: { short_url?: string; image_url?: string; id?: string } | null;
};

function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export default function PaymentSessionPage() {
  const router = useRouter();
  const isClient = useIsClient();
  const params = useParams<{ sessionId: string | string[] }>();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<SessionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generatedQrDataUrl, setGeneratedQrDataUrl] = useState("");
  const sessionIdRaw = Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId;
  const token = isClient ? getPortalToken() : null;
  const sessionId = Number(sessionIdRaw);
  const hasInvalidSessionId = !Number.isFinite(sessionId);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
    if (hasInvalidSessionId) return;

    let closed = false;
    const load = async () => {
      try {
        const data = await apiGet<SessionData>(`/sessions/${sessionId}`, token);
        if (!closed) setSession(data);
      } catch (err: unknown) {
        if (!closed) setError(getErrorMessage(err, "Failed to load session"));
      }
    };

    void load();
    const timer = setInterval(() => void load(), 3000);
    return () => {
      closed = true;
      clearInterval(timer);
    };
  }, [hasInvalidSessionId, router, sessionId, token]);

  const paymentLink =
    searchParams.get("paymentLink") ?? session?.razorpayPayloadJson?.short_url ?? "";
  const qrImageUrl = session?.razorpayPayloadJson?.image_url ?? "";

  useEffect(() => {
    let cancelled = false;
    const buildLinkQr = async () => {
      if (!paymentLink || qrImageUrl) {
        if (!cancelled) setGeneratedQrDataUrl("");
        return;
      }
      try {
        const dataUrl = await QRCode.toDataURL(paymentLink, {
          margin: 1,
          width: 320,
        });
        if (!cancelled) setGeneratedQrDataUrl(dataUrl);
      } catch {
        if (!cancelled) setGeneratedQrDataUrl("");
      }
    };

    void buildLinkQr();
    return () => {
      cancelled = true;
    };
  }, [paymentLink, qrImageUrl]);
  const qrDisplaySource = qrImageUrl || generatedQrDataUrl;


  const captured = useMemo(() => {
    const s = (session?.status ?? "").toUpperCase();
    return (
      Boolean(session?.amountCaptured) ||
      s.includes("CAPTUR") ||
      s.includes("PAID") ||
      s.includes("APPLIED")
    );
  }, [session]);

  const handleCopyLink = async () => {
    if (!paymentLink) return;
    try {
      await navigator.clipboard.writeText(paymentLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setError("Unable to copy payment link");
    }
  };

  if (!isClient || !token) return null;

  const ringCirc = 2 * Math.PI * 42;

  return (
    <section className="mx-auto max-w-xl space-y-4">
      {/* header */}
      <div className="flex items-center gap-3 px-1">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="grid size-9 place-items-center rounded-full border border-border/70 bg-card/60 text-foreground backdrop-blur transition hover:bg-muted active:scale-95"
          aria-label="Back"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div>
          <p className="eyebrow">Session detail</p>
          <h1 className="display text-xl">Payment Session #{sessionIdRaw}</h1>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {hasInvalidSessionId ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Invalid session id
        </p>
      ) : null}

      {session ? (
        <>
          {/* status hero */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="quiet-card relative overflow-hidden p-6 text-center"
          >
            <div className="relative mx-auto size-24">
              <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
                <circle cx="48" cy="48" r="42" fill="none" strokeWidth="6" className="stroke-success/15" />
                <motion.circle
                  cx="48"
                  cy="48"
                  r="42"
                  fill="none"
                  strokeWidth="6"
                  strokeLinecap="round"
                  className="stroke-success"
                  strokeDasharray={ringCirc}
                  initial={false}
                  animate={{ strokeDashoffset: captured ? 0 : ringCirc }}
                  transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                />
              </svg>
              <div className="absolute inset-0 grid place-items-center text-success">
                {captured ? (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 16 }}
                  >
                    <Check className="size-9" strokeWidth={2.6} />
                  </motion.span>
                ) : (
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>

            <p className="mt-4 eyebrow">Amount captured</p>
            <AnimatedAmount
              value={session.amountCaptured ?? 0}
              className="display mt-1 block text-4xl"
            />

            <span
              className={`mt-3 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold ${captured ? "bg-success/13 text-success" : "bg-amber-500/14 text-amber-500"
                }`}
            >
              <span
                className={`size-1.5 rounded-full bg-current ${captured ? "" : "animate-soft-pulse"}`}
              />
              {captured ? "Payment captured" : "Awaiting payment…"}
            </span>
          </motion.div>

          {/* details */}
          <div className="quiet-card px-5 py-1.5 text-sm">
            {[
              ["Status", session.status],
              ["Amount requested", `₹${session.amountRequested.toLocaleString("en-IN")}`],
              [
                "Amount applied",
                session.amountApplied != null
                  ? `₹${session.amountApplied.toLocaleString("en-IN")}`
                  : "—",
              ],
              ["Razorpay order", session.razorpayOrderId ?? "—"],
              ["Payment link id", session.razorpayPaymentLinkId ?? "—"],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex items-center justify-between gap-4 border-b border-border/50 py-3 last:border-none"
              >
                <span className="text-muted-foreground">{k}</span>
                <span className="truncate text-right font-semibold tnum">{v}</span>
              </div>
            ))}
          </div>

          {qrDisplaySource ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="quiet-card p-5"
            >
              <p className="field-label">Scan to pay</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Ask the guest to scan this QR and complete payment.
              </p>
              <div className="mt-3 rounded-2xl border border-border/70 bg-background/70 p-4">
                <Image
                  src={qrDisplaySource}
                  alt="Payment QR"
                  className="mx-auto size-[220px] max-w-full rounded-lg bg-white p-2"
                  width={220}
                  height={220}
                  unoptimized
                />
              </div>
            </motion.div>
          ) : null}

          {/* payment link */}
          {paymentLink ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="quiet-card p-5"
            >
              <p className="field-label">Payment link</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Share this with the guest to complete payment.
              </p>
              <div className="mt-3 flex gap-2">
                <Input value={paymentLink} readOnly className="h-11 rounded-xl font-mono text-xs" />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:brightness-110 active:scale-95"
                >
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <a
                  href={paymentLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 shrink-0 items-center rounded-xl border border-border/70 px-4 text-sm font-semibold text-foreground transition hover:bg-muted active:scale-95"
                >
                  Open
                </a>
              </div>
            </motion.div>
          ) : null}
        </>
      ) : !hasInvalidSessionId ? (
        <div className="quiet-card flex items-center gap-3 p-5 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading session…
        </div>
      ) : null}
    </section>
  );
}
