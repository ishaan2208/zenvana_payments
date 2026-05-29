import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import SessionsPage from "./page";

const mockGetMySessions = vi.fn();

vi.mock("@/components/session-status-chip", () => ({
  __esModule: true,
  default: ({ status }: { status: string }) => <span>{status}</span>,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/auth", () => ({
  getPortalToken: () => "token",
}));

vi.mock("@/lib/use-is-client", () => ({
  useIsClient: () => true,
}));

vi.mock("@/lib/sessions", () => ({
  getMySessions: (...args: unknown[]) => mockGetMySessions(...args),
}));

it("renders empty-state history message when no sessions exist", async () => {
  mockGetMySessions.mockResolvedValue([]);

  render(<SessionsPage />);

  expect(await screen.findByRole("heading", { name: /session history/i })).toBeInTheDocument();
  expect(
    await screen.findByText(/no sessions created yet\. create one from dashboard\./i)
  ).toBeInTheDocument();
});

it("renders backend sessions with captured status", async () => {
  mockGetMySessions.mockResolvedValue([
    {
    id: 52,
    createdAt: "2026-05-29T19:05:00.000Z",
    status: "CAPTURED",
    amountRequested: 1820,
    amountCaptured: 1820,
    amountApplied: 1820,
    razorpayOrderId: "order_123",
    razorpayPaymentLinkId: null,
    },
  ]);

  render(<SessionsPage />);

  expect(await screen.findByText(/session #52/i)).toBeInTheDocument();
  expect((await screen.findAllByText(/₹1,820/i)).length).toBeGreaterThan(0);
  expect(await screen.findByText("CAPTURED")).toBeInTheDocument();
});
