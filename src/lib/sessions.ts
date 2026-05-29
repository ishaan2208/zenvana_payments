import { apiGet } from "@/lib/api-client";

export type PaymentSession = {
  id: number;
  status: string;
  amountRequested: number;
  amountCaptured: number | null;
  amountApplied: number | null;
  razorpayOrderId: string | null;
  razorpayPaymentLinkId: string | null;
  razorpayPayloadJson?: { short_url?: string } | null;
};

export function getSessionById(sessionId: number, token: string) {
  return apiGet<PaymentSession>(`/sessions/${sessionId}`, token);
}
