# Zenvana Payments Brand Parity Design

## Goal

Upgrade `zenvana_payments` to the same premium visual language as `zenvana`, including:
- shared color/theme identity (light + dark),
- phone-centric but desktop-ready responsive UX,
- global app navbar and full in-app navigability,
- first-load splash experience,
- brand icon/logo reuse from `zenvana`,
- session history page (current user only for now),
- sign-out flow.

## Scope

### In scope
- New global design tokens in `src/app/globals.css` matching Zenvana brand hues.
- Dark/light theme support with persisted user preference.
- New global app shell with top navbar, mobile-optimized spacing, desktop nav links.
- Sign out action in the navbar.
- Splash screen shown only once per browser session on first app load.
- Sessions history route with status-focused list UI and search/filter basics.
- Navigation routes:
  - Dashboard
  - Sessions
  - Login
  - Payment session detail

### Out of scope
- Backend contract redesign.
- Team/property-wide session list behavior (future B phase).
- Heavy animation parity with the full marketing site.

## UX Architecture

### App shell
- Sticky, translucent brand navbar with logo mark + text.
- Mobile-first nav priority:
  - compact header,
  - larger touch targets,
  - clear active-route highlighting.
- Desktop enhances with horizontal nav and utility controls.

### Visual system
- Adopt Zenvana-inspired palette:
  - sand background,
  - deep navy foreground,
  - lime accent,
  - green success notes.
- Maintain high contrast in dark mode using true dark background and bright accent.
- Quiet cards, rounded corners, soft borders, restrained shadows.

### Splash
- A short branded first-load splash.
- Suppressed after first display using `sessionStorage`.
- Respect reduced motion preference.

### Sessions page (A phase)
- Show sessions created in scope of currently logged-in user via existing token-based API.
- Card/list hybrid layout suitable for phone and desktop.
- Status chips for quick scanning.
- Fast access to each session detail page.
- If backend endpoint unavailable, show clear empty/error messaging and retry affordance.

## Data Flow

- Keep auth token cookie flow from existing implementation.
- Add optional profile persistence for navbar identity in `localStorage`.
- Sessions list fetch uses dedicated API adapter helper (single abstraction point).
- Future B phase only swaps adapter behavior/endpoint parameters.

## Error Handling

- Unified error banner style for all pages.
- Explicit loading states for async sections.
- Graceful no-data states.
- Session detail and list pages should never hard crash on malformed payloads.

## Testing Strategy

- Test-first updates for changed UX behavior:
  - splash first-load gate behavior,
  - navbar route rendering/signout action visibility,
  - sessions page list-state and fallback-state rendering,
  - existing redirect/login tests stay passing.
- Run:
  - targeted tests for modified components/routes,
  - full `npm test`,
  - lint checks.

## Implementation Notes

- Reuse assets from:
  - `zenvana/src/app/icon.svg`,
  - `zenvana/public/Zenvana logo/*`.
- Copy required logo assets into `zenvana_payments/public` paths used by new components.
- Keep implementation modular:
  - theme provider,
  - app shell/navbar,
  - splash component,
  - sessions data adapter.
