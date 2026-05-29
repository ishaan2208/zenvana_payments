"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import CreateSessionForm from "@/components/forms/create-session-form";
import QuoteForm, { QuoteSubmitInput } from "@/components/forms/quote-form";
import { apiPost } from "@/lib/api-client";
import { getPortalToken } from "@/lib/auth";

type QuoteData = {
  bookingId: number;
  anchorOrderId: number | null;
  bookingDue: number;
  ordersDueTotal: number;
  totalDue: number;
  allowedModes: string[];
};

type SessionCreateResponse = {
  session: { id: number; status: string };
  razorpay: {
    mode: "CHECKOUT_REDIRECT" | "PAYMENT_LINK";
    orderId?: string;
    paymentLinkUrl?: string;
  };
};

export default function DashboardPage() {
  const router = useRouter();
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const token = useMemo(() => getPortalToken(), []);

  const handleQuoteSubmit = async (input: QuoteSubmitInput) => {
    setError(null);
    const quoteData = await apiPost<QuoteData>("/quote", input, token ?? undefined);
    setQuote(quoteData);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col p-6">
      <h1 className="text-2xl font-semibold">Collect Payment</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter either booking ID or order ID to fetch dues.
      </p>

      <QuoteForm onSubmit={handleQuoteSubmit} />

      {quote ? (
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
              if (result.razorpay.mode === "PAYMENT_LINK" && result.razorpay.paymentLinkUrl) {
                window.open(result.razorpay.paymentLinkUrl, "_blank", "noopener,noreferrer");
              }
              router.push(`/payment/${result.session.id}`);
            } catch (err: any) {
              setError(err?.message ?? "Failed to create session");
            }
          }}
        />
      ) : null}

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </main>
  );
}
