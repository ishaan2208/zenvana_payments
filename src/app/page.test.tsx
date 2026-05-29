import { vi } from "vitest";
import HomePage from "./page";
import { redirect } from "next/navigation";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

it("redirects root path to dashboard", () => {
  HomePage();
  expect(redirect).toHaveBeenCalledWith("/dashboard");
});
