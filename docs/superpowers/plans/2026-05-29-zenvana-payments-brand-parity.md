# Zenvana Payments Brand Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Zenvana-level branded UX in `zenvana_payments` with dark/light theme, app-wide navbar navigation, first-load splash, signout, and a current-user sessions history page.

**Architecture:** Add a shared app shell layer and theme infrastructure at root layout level, then migrate each route into that shell. Keep API changes behind a new sessions adapter so future team-wide expansion only changes data fetching, not UI. Implement mobile-first screens and progressively enhance desktop density.

**Tech Stack:** Next.js App Router, React, Tailwind v4 tokens, existing UI primitives, Vitest + Testing Library.

---

## File Structure

- Create: `src/components/theme-provider.tsx`
- Create: `src/components/theme-toggle.tsx`
- Create: `src/components/brand-logo.tsx`
- Create: `src/components/initial-splash.tsx`
- Create: `src/components/app-shell.tsx`
- Create: `src/components/session-status-chip.tsx`
- Create: `src/lib/sessions.ts`
- Create: `src/app/sessions/page.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/payment/[sessionId]/page.tsx`
- Modify: `src/lib/auth.ts`
- Modify: `src/lib/api-client.ts` (only if needed for query support)
- Test: `src/app/page.test.tsx`
- Test: `src/components/forms/login-form.test.tsx`
- Test: `src/components/forms/quote-form.test.tsx`
- Create test: `src/components/app-shell.test.tsx`
- Create test: `src/components/initial-splash.test.tsx`
- Create test: `src/app/sessions/page.test.tsx`

### Task 1: Brand Tokens + Theme Infrastructure

**Files:**
- Create: `src/components/theme-provider.tsx`
- Create: `src/components/theme-toggle.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Write failing test for theme toggle rendering**

```tsx
import { render, screen } from "@testing-library/react";
import { ThemeToggle } from "./theme-toggle";

it("renders theme toggle button", () => {
  render(<ThemeToggle />);
  expect(screen.getByRole("button", { name: /theme/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/theme-toggle.test.tsx`
Expected: FAIL with module not found for `theme-toggle`.

- [ ] **Step 3: Implement minimal theme provider/toggle and wire into layout**

```tsx
// theme-provider.tsx
import { ThemeProvider as NextThemesProvider } from "next-themes";
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <NextThemesProvider attribute="class" defaultTheme="light">{children}</NextThemesProvider>;
}
```

- [ ] **Step 4: Add Zenvana color tokens in globals.css**

```css
:root { --background: 66 39% 95%; --foreground: 210 100% 12%; --accent: 64 76% 60%; }
.dark { --background: 222 24% 6%; --foreground: 60 20% 96%; --accent: 64 76% 60%; }
```

- [ ] **Step 5: Re-run tests**

Run: `npm test -- src/components/theme-toggle.test.tsx`
Expected: PASS.

### Task 2: Splash + Brand Logo Assets

**Files:**
- Create: `src/components/initial-splash.tsx`
- Create: `src/components/brand-logo.tsx`
- Modify: `src/app/layout.tsx`
- Create: `public/Zenvana logo/Zenvana logo (1).svg`
- Create: `src/app/icon.svg` (copied from `zenvana`)

- [ ] **Step 1: Write failing splash gate test**

```tsx
import { render, screen } from "@testing-library/react";
import { InitialSplash } from "./initial-splash";

it("shows splash before first-load gate closes", () => {
  render(<InitialSplash />);
  expect(screen.getByLabelText(/loading zenvana/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- src/components/initial-splash.test.tsx`
Expected: FAIL until component exists.

- [ ] **Step 3: Implement splash with sessionStorage first-load gate**

```tsx
const KEY = "zp_splash_seen";
if (sessionStorage.getItem(KEY)) return null;
sessionStorage.setItem(KEY, "1");
```

- [ ] **Step 4: Re-run test**

Run: `npm test -- src/components/initial-splash.test.tsx`
Expected: PASS.

### Task 3: App Shell + Global Navbar + Signout

**Files:**
- Create: `src/components/app-shell.tsx`
- Modify: `src/lib/auth.ts`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Write failing app shell nav test**

```tsx
import { render, screen } from "@testing-library/react";
import { AppShell } from "./app-shell";

it("renders navigation links", () => {
  render(<AppShell><div>Body</div></AppShell>);
  expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /sessions/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- src/components/app-shell.test.tsx`
Expected: FAIL because `AppShell` is missing.

- [ ] **Step 3: Implement navbar + signout trigger**

```tsx
import { clearPortalToken } from "@/lib/auth";
// ...
<button onClick={() => { clearPortalToken(); router.push("/login"); }}>Sign out</button>
```

- [ ] **Step 4: Re-run test**

Run: `npm test -- src/components/app-shell.test.tsx`
Expected: PASS.

### Task 4: Sessions API Adapter + Sessions Route

**Files:**
- Create: `src/lib/sessions.ts`
- Create: `src/components/session-status-chip.tsx`
- Create: `src/app/sessions/page.tsx`

- [ ] **Step 1: Write failing sessions page render test**

```tsx
import { render, screen } from "@testing-library/react";
import SessionsPage from "./page";

it("renders sessions heading", () => {
  render(<SessionsPage />);
  expect(screen.getByRole("heading", { name: /sessions/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- src/app/sessions/page.test.tsx`
Expected: FAIL because route file is missing.

- [ ] **Step 3: Implement sessions adapter + page with loading/error/empty/list states**

```ts
export async function getMySessions(token: string) {
  return apiGet<PaymentSession[]>("/sessions", token);
}
```

```tsx
if (error) return <p>Could not load sessions</p>;
if (!sessions.length) return <p>No sessions found</p>;
```

- [ ] **Step 4: Re-run test**

Run: `npm test -- src/app/sessions/page.test.tsx`
Expected: PASS.

### Task 5: Migrate Existing Pages to Shell + Branded Styling

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/payment/[sessionId]/page.tsx`
- Modify: `src/app/login/page.tsx`
- Modify: `src/components/forms/login-form.tsx`
- Modify: `src/components/forms/quote-form.tsx`
- Modify: `src/components/forms/create-session-form.tsx`

- [ ] **Step 1: Write failing assertion updates for existing tests**

```tsx
expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
expect(screen.getByLabelText("Booking ID")).toBeInTheDocument();
```

- [ ] **Step 2: Run affected tests to observe failures**

Run: `npm test -- src/components/forms/login-form.test.tsx src/components/forms/quote-form.test.tsx`
Expected: FAIL if labels changed.

- [ ] **Step 3: Implement mobile-first branded layouts while preserving form semantics**

```tsx
<main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">{/* content */}</main>
```

- [ ] **Step 4: Re-run form tests**

Run: `npm test -- src/components/forms/login-form.test.tsx src/components/forms/quote-form.test.tsx`
Expected: PASS.

### Task 6: Verification and Cleanup

**Files:**
- Modify: any touched files from Tasks 1-5.

- [ ] **Step 1: Run targeted tests**

Run: `npm test -- src/components/app-shell.test.tsx src/components/initial-splash.test.tsx src/app/sessions/page.test.tsx`
Expected: PASS.

- [ ] **Step 2: Run full test suite**

Run: `npm test`
Expected: PASS (0 failed).

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: PASS (no new errors).

- [ ] **Step 4: Manual smoke verification**

Run: `npm run dev`
Expected:
- Navbar visible on app routes,
- Theme toggle changes appearance,
- Splash appears first load only,
- Sign out redirects to login,
- Sessions page reachable and renders list/empty state.
