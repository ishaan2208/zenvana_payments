import { apiGet } from "@/lib/api-client";

export type PaymentSession = {
  id: number;
  createdAt?: string;
  status: string;
  amountRequested: number;
  amountCaptured: number | null;
  amountApplied: number | null;
  razorpayOrderId: string | null;
  razorpayPaymentLinkId: string | null;
  razorpayPayloadJson?: { short_url?: string; image_url?: string; id?: string } | null;
};

export function getSessionById(sessionId: number, token: string) {
  return apiGet<PaymentSession>(`/sessions/${sessionId}`, token);
}

export function getMySessions(token: string) {
  return apiGet<PaymentSession[]>("/sessions", token);
}
