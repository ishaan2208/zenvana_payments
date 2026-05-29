import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PaymentSessionPage from "./page";

const mockApiGet = vi.fn();
const mockToDataURL = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useParams: () => ({ sessionId: "42" }),
  useSearchParams: () => new URLSearchParams("paymentLink=https://rzp.io/i/test-link"),
}));

vi.mock("@/lib/auth", () => ({
  getPortalToken: () => "token",
}));

vi.mock("@/lib/use-is-client", () => ({
  useIsClient: () => true,
}));

vi.mock("@/lib/api-client", () => ({
  apiGet: (...args: unknown[]) => mockApiGet(...args),
}));

vi.mock("qrcode", () => ({
  default: {
    toDataURL: (...args: unknown[]) => mockToDataURL(...args),
  },
}));

describe("PaymentSessionPage", () => {
  beforeEach(() => {
    mockApiGet.mockReset();
    mockToDataURL.mockReset();
    mockApiGet.mockResolvedValue({
      id: 42,
      status: "PENDING",
      amountRequested: 1200,
      amountCaptured: null,
      amountApplied: null,
      razorpayOrderId: null,
      razorpayPaymentLinkId: "plink_123",
      razorpayPayloadJson: {
        short_url: "https://rzp.io/i/test-link",
        image_url: "https://rzp.io/i/qr-image.png",
      },
    });
    mockToDataURL.mockResolvedValue("data:image/png;base64,test");
  });

  it("renders qr section for guest scan when payment link exists", async () => {
    render(<PaymentSessionPage />);

    expect(await screen.findByText(/scan to pay/i)).toBeInTheDocument();
    expect(screen.getByAltText(/payment qr/i)).toBeInTheDocument();
  });

  it("builds qr from payment link when razorpay image is absent", async () => {
    mockApiGet.mockResolvedValueOnce({
      id: 42,
      status: "PENDING",
      amountRequested: 1200,
      amountCaptured: null,
      amountApplied: null,
      razorpayOrderId: null,
      razorpayPaymentLinkId: "plink_123",
      razorpayPayloadJson: {
        short_url: "https://rzp.io/i/test-link",
      },
    });

    render(<PaymentSessionPage />);

    expect(await screen.findByAltText(/payment qr/i)).toBeInTheDocument();
    expect(mockToDataURL).toHaveBeenCalledWith(
      "https://rzp.io/i/test-link",
      expect.objectContaining({ margin: 1, width: 320 })
    );
  });
});
