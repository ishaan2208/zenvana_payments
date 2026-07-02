# Zenvana Payments

@AGENTS.md

Staff-facing payments portal for StaySystems. Front-office users log in, quote what a guest owes (booking dues, F&B/order dues, or both), open a Razorpay collection session, and share a QR/payment link or run checkout. Correctness of money and integrity of the payment flow are paramount — this is a money-movement surface, treat it as such.

## Architecture & intent

- **Next.js 16 (App Router) + React 19 + TypeScript**, Tailwind v4, framer-motion, Radix/base-ui + shadcn primitives, zod + react-hook-form. Managed with **pnpm** (see `pnpm-lock.yaml`, `pnpm-workspace.yaml`).
- **The portal is a thin, trusted client over the backend.** All money logic — quoting, session creation, capture, reconciliation — lives in the sibling `backend` API, reached through `src/lib/api-client.ts` at `NEXT_PUBLIC_PAYMENTS_API_BASE` (default `http://localhost:3000/api/v1/public/payments-portal`). Responses use an `{ statuscode, message, data }` envelope; the client unwraps `data` and throws on non-2xx. This portal renders and orchestrates; it does not compute or hold authoritative balances.
- **Routes** (`src/app/`): `login`, `dashboard` (quote + create session drawer), `sessions` (current user's history), `payment/[sessionId]` (session detail, QR, link, live status). `proxy.ts` is the route middleware — it gates `/dashboard` and `/payment/*` on the `paymentsPortalToken` cookie and bounces logged-in users away from `/login`.
- **Auth** (`src/lib/auth.ts`): a bearer token in the `paymentsPortalToken` cookie (12h max-age, `Secure` on https, `SameSite=Lax`) plus a non-authoritative `PortalProfile` cached in localStorage for navbar identity. The token is the only credential the API trusts.
- **Razorpay** is loaded client-side (`src/lib/razorpay-checkout.ts`) via the hosted checkout script; the backend issues the `orderId`/`keyId`. Payment sessions support two modes: `CHECKOUT_REDIRECT` and `PAYMENT_LINK` (QR + shareable short URL). `payment/[sessionId]` polls session status every 3s until captured.

## Boundaries

- **Never trust the client for money.** Amounts, dues, and capture state are authoritative only from the backend. Do not compute or "correct" balances locally beyond display.
- **Preserve the collection-mode invariants** (`src/components/forms/create-session-form.tsx`): `BOTH` and `ORDERS_ONLY` lock the amount to the exact due; only `BOOKING_ONLY` allows an editable partial amount, and it must never exceed `bookingDue`. Do not relax these without an explicit backend-backed reason.
- **Never log or expose secrets/PII** — tokens, guest phone/name, Razorpay ids. Keep the bearer token in its cookie; do not widen its scope, drop `SameSite`/`Secure`, or stash it in localStorage.
- **Idempotency & double-charge safety:** session creation and capture are backend-owned and must stay so. Do not add client-side retries that could create duplicate sessions or re-submit a capture; the detail page's polling is read-only by design — keep it that way.
- **Validate all input at the boundary** with the zod schemas in `src/lib/schemas.ts`. Razorpay signature/webhook verification is the backend's responsibility — do not attempt to verify or trust payment outcomes purely from the client `handler` callback.
- Note the repo contains stray duplicates (`components/forms copy/`, `InitialSplash.tsx` vs `initial-splash.tsx`, `session-status-chip copy.tsx`) — edit the real kebab-case files under `forms/` and `components/`, not the `copy` variants.

## Verify your work

```bash
pnpm dev     # Next dev server
pnpm build   # must compile clean (React 19 / Next 16)
pnpm lint    # eslint (flat config)
pnpm test    # vitest + Testing Library (jsdom)
```

Tests colocate as `*.test.ts(x)` next to sources (forms, pages, lib). Done and correct means: build, lint, and the full vitest suite pass; the collection-mode amount invariants still hold; auth gating in `proxy.ts` still redirects unauthenticated access; and no secret, token, or guest PII has entered logs or client-persisted storage. Per `AGENTS.md`, this is Next.js 16 — check `node_modules/next/dist/docs/` before writing framework code rather than assuming older-version APIs.
