import { describe, expect, it } from "vitest";
import { getPaymentSessionRoute } from "./payment-flow";

describe("getPaymentSessionRoute", () => {
  it("returns encoded payment link route for checkout redirect mode", () => {
    expect(
      getPaymentSessionRoute({
        sessionId: 42,
        razorpay: {
          mode: "CHECKOUT_REDIRECT",
          paymentLinkUrl: "https://rzp.io/i/abc 123",
        },
      })
    ).toBe("/payment/42?paymentLink=https%3A%2F%2Frzp.io%2Fi%2Fabc%20123");
  });

  it("returns encoded payment link route for payment link mode", () => {
    expect(
      getPaymentSessionRoute({
        sessionId: 7,
        razorpay: {
          mode: "PAYMENT_LINK",
          paymentLinkUrl: "https://rzp.io/i/xyz",
        },
      })
    ).toBe("/payment/7?paymentLink=https%3A%2F%2Frzp.io%2Fi%2Fxyz");
  });

  it("falls back to plain session route when payment link missing", () => {
    expect(
      getPaymentSessionRoute({
        sessionId: 99,
        razorpay: {
          mode: "CHECKOUT_REDIRECT",
        },
      })
    ).toBe("/payment/99");
  });
});
