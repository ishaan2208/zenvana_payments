import { render, screen } from "@testing-library/react";
import { AppShell } from "./app-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/auth", () => ({
  clearPortalProfile: vi.fn(),
  clearPortalToken: vi.fn(),
  clearPortalSession: vi.fn(),
  getPortalProfile: () => null,
  getPortalToken: () => null,
}));

vi.mock("./theme-toggle", () => ({
  ThemeToggle: () => <button type="button">Theme</button>,
}));

it("renders global app navigation", () => {
  render(
    <AppShell>
      <div>Body</div>
    </AppShell>
  );
  expect(screen.getAllByRole("link", { name: /dashboard/i }).length).toBeGreaterThan(0);
  expect(screen.getAllByRole("link", { name: /sessions/i }).length).toBeGreaterThan(0);
});
