type RazorpayMode = "CHECKOUT_REDIRECT" | "PAYMENT_LINK";

type PaymentRouteInput = {
  sessionId: number;
  razorpay: {
    mode: RazorpayMode;
    paymentLinkUrl?: string;
  };
};

export function getPaymentSessionRoute(input: PaymentRouteInput) {
  const paymentLinkUrl = input.razorpay.paymentLinkUrl?.trim();
  if (paymentLinkUrl) {
    return `/payment/${input.sessionId}?paymentLink=${encodeURIComponent(paymentLinkUrl)}`;
  }
  return `/payment/${input.sessionId}`;
}
