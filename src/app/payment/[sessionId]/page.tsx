"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api-client";
import { getPortalToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIsClient } from "@/lib/use-is-client";

type SessionData = {
  id: number;
  status: string;
  amountRequested: number;
  amountCaptured: number | null;
  amountApplied: number | null;
  razorpayOrderId: string | null;
  razorpayPaymentLinkId: string | null;
  razorpayPayloadJson?: { short_url?: string } | null;
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
  const sessionIdRaw = Array.isArray(params.sessionId)
    ? params.sessionId[0]
    : params.sessionId;
  const token = isClient ? getPortalToken() : null;
  const sessionId = Number(sessionIdRaw);
  const hasInvalidSessionId = !Number.isFinite(sessionId);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
    if (hasInvalidSessionId) {
      return;
    }

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
    const timer = setInterval(() => {
      void load();
    }, 3000);

    return () => {
      closed = true;
      clearInterval(timer);
    };
  }, [hasInvalidSessionId, router, sessionId, token]);

  if (!isClient || !token) return null;

  const paymentLink =
    searchParams.get("paymentLink") ?? session?.razorpayPayloadJson?.short_url ?? "";

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

  return (
    <section className="space-y-4 pb-2">
      <div className="quiet-card p-4 sm:p-5">
        <p className="field-label">Session detail</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Payment Session #{sessionIdRaw}</h1>
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
        <div className="quiet-card p-4 text-sm sm:p-5">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <p>Status: {session.status}</p>
            <p>Amount requested: ₹{session.amountRequested}</p>
            <p>Amount captured: ₹{session.amountCaptured ?? "-"}</p>
            <p>Amount applied: ₹{session.amountApplied ?? "-"}</p>
            <p>Razorpay order: {session.razorpayOrderId ?? "-"}</p>
            <p>Payment link id: {session.razorpayPaymentLinkId ?? "-"}</p>
          </div>
          {paymentLink ? (
            <div className="mt-3 flex flex-col gap-2">
              <p className="field-label">Payment Link</p>
              <div className="flex gap-2">
                <Input value={paymentLink} readOnly className="h-10 rounded-xl" />
                <Button type="button" onClick={handleCopyLink} className="h-10 rounded-xl">
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="quiet-card p-4 text-sm text-muted-foreground">Loading session...</p>
      )}
    </section>
  );
}
