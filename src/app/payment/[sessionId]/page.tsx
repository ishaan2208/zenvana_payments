"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api-client";
import { getPortalToken } from "@/lib/auth";

type SessionData = {
  id: number;
  status: string;
  amountRequested: number;
  amountCaptured: number | null;
  amountApplied: number | null;
  razorpayOrderId: string | null;
  razorpayPaymentLinkId: string | null;
};

export default function PaymentSessionPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getPortalToken() ?? undefined;
    const id = Number(params.sessionId);
    if (!Number.isFinite(id)) {
      setError("Invalid session id");
      return;
    }

    let closed = false;
    const load = async () => {
      try {
        const data = await apiGet<SessionData>(`/sessions/${id}`, token);
        if (!closed) setSession(data);
      } catch (err: any) {
        if (!closed) setError(err?.message ?? "Failed to load session");
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
  }, [params.sessionId]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col p-6">
      <h1 className="text-2xl font-semibold">Payment Session #{params.sessionId}</h1>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      {session ? (
        <div className="mt-4 rounded-md border p-4 text-sm">
          <p>Status: {session.status}</p>
          <p>Amount requested: {session.amountRequested}</p>
          <p>Amount captured: {session.amountCaptured ?? "-"}</p>
          <p>Amount applied: {session.amountApplied ?? "-"}</p>
          <p>Razorpay order: {session.razorpayOrderId ?? "-"}</p>
          <p>Payment link id: {session.razorpayPaymentLinkId ?? "-"}</p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">Loading session...</p>
      )}
    </main>
  );
}
