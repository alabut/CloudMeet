# Visual QA Matrix — Public Edge States

Loopback-only preview URLs for deterministic visual QA. All fixture data uses **2030-09-11 2:00–2:30 PM America/Los_Angeles** unless noted. Production hosts must never receive fixture data.

## Canonical viewports

| Label | Size | Use |
|---|---|---|
| Phone | 390×844 | Primary mobile pass |
| Phone (long form) | 390×667 | Scroll-safe forms — cancel, reschedule-response |
| Tablet | 820×1180 | Reschedule calendar width transition |
| Short laptop | 1280×720 | Centered outcomes, vertical centering stress |
| Desktop | 1440×1000 | Reschedule desktop card width |

Check **dark** and **light** (`prefers-color-scheme`) for every state below.

---

## Shared preview constants

| Constant | Value |
|---|---|
| Booking ID | `preview-sample-booking` |
| Proposal token | `preview-sample-proposal` |
| Sample timezone | `America/Los_Angeles` |
| Sample slot | Wed Sep 11, 2030 · 2:00–2:30 PM PT |

---

## Booking (`/30min`)

| State | URL |
|---|---|
| Success | `http://localhost:5173/30min?preview=success` |
| Details (desktop) | `http://localhost:5173/30min?preview=details` |

---

## Cancel (`/cancel/preview-sample-booking`)

| State | URL |
|---|---|
| Form | `http://localhost:5173/cancel/preview-sample-booking` |
| Reason filled | `http://localhost:5173/cancel/preview-sample-booking?preview=reason` |
| Error | `http://localhost:5173/cancel/preview-sample-booking?preview=error` |
| Submitting | `http://localhost:5173/cancel/preview-sample-booking?preview=submitting` |
| Success | `http://localhost:5173/cancel/preview-sample-booking?preview=success` |
| Already cancelled | `http://localhost:5173/cancel/preview-sample-booking?preview=already-cancelled` |

**Viewport notes:** Use 390×667 for form scroll; success uses borderless outer shell on mobile.

---

## Reschedule (`/reschedule/preview-sample-booking`)

| State | URL |
|---|---|
| Form | `http://localhost:5173/reschedule/preview-sample-booking` |
| Date + slot selected | `http://localhost:5173/reschedule/preview-sample-booking?preview=selected` |
| Loading slots | `http://localhost:5173/reschedule/preview-sample-booking?preview=loading` |
| Empty slots | `http://localhost:5173/reschedule/preview-sample-booking?preview=empty` |
| Error | `http://localhost:5173/reschedule/preview-sample-booking?preview=error` |
| Submitting | `http://localhost:5173/reschedule/preview-sample-booking?preview=submitting` |
| Success | `http://localhost:5173/reschedule/preview-sample-booking?preview=success` |

**Viewport notes:** 820×1180 for card width transition; 1280×720 for success centering.

---

## Reschedule response (`/reschedule-response/preview-sample-proposal`)

| State | URL |
|---|---|
| Pending (with message) | `http://localhost:5173/reschedule-response/preview-sample-proposal` |
| Pending (no message) | `http://localhost:5173/reschedule-response/preview-sample-proposal?preview=pending-no-message` |
| Error | `http://localhost:5173/reschedule-response/preview-sample-proposal?preview=error` |
| Counter | `http://localhost:5173/reschedule-response/preview-sample-proposal?preview=counter` |
| Accepted | `http://localhost:5173/reschedule-response/preview-sample-proposal?preview=accepted` |
| Declined | `http://localhost:5173/reschedule-response/preview-sample-proposal?preview=declined` |
| Already accepted | `http://localhost:5173/reschedule-response/preview-sample-proposal?preview=already-accepted` |
| Already declined | `http://localhost:5173/reschedule-response/preview-sample-proposal?preview=already-declined` |
| Submitting accept | `http://localhost:5173/reschedule-response/preview-sample-proposal?preview=submitting-accept` |
| Submitting decline | `http://localhost:5173/reschedule-response/preview-sample-proposal?preview=submitting-decline` |

**Viewport notes:** 390×667 for long pending form; verify original time is neutral (not red).

---

## Privacy

| State | URL |
|---|---|
| Document | `http://localhost:5173/privacy` |

---

## Public error boundary

| State | URL |
|---|---|
| 400 | `http://localhost:5173/__preview/error/400` |
| 404 | `http://localhost:5173/__preview/error/404` |
| 500 | `http://localhost:5173/__preview/error/500` |

Non-loopback hosts always 404 for `__preview/*`.

---

## Design system catalog

| Surface | URL |
|---|---|
| Primitives + BookingSummary | `http://localhost:5173/design-system` |

---

## Safety checklist

- [ ] Preview IDs/tokens return 404 on non-loopback hosts
- [ ] Preview form actions do not reach DB/calendar/email
- [ ] Real booking IDs still use production loaders/actions
- [ ] No raw 500 messages on public error page
- [ ] Zoom wording preserved on reschedule success

---

## Playwright visual regression suite

Local visual tests run against **http://127.0.0.1:4173** only. They never contact production. The Playwright `webServer` starts (or reuses) the full CloudMeet dev stack via `npm run dev -- --port 4173`, so SvelteKit and local Cloudflare bindings match manual preview.

### Commands

| Command | Purpose |
|---|---|
| `npm run test:visual` | Run the full visual + behavior suite against committed snapshot baselines |
| `npm run test:visual:update` | Regenerate snapshot PNGs after an intentional visual change |
| `npm run test:visual:ui` | Open Playwright UI mode for debugging a single test or project |
| `npm run playwright:install` | Install the Chromium browser binary (one-time setup on a new machine) |

Discovery only (no server, no snapshots):

```bash
npx playwright test --list
```

### Projects (viewports × themes)

| Project | Viewport | Theme |
|---|---|---|
| `phone-dark` | 390×844 | dark |
| `phone-light` | 390×844 | light |
| `desktop-dark` | 1440×1000 | dark |
| `desktop-light` | 1440×1000 | light |
| `short-laptop-dark` | 1280×720 | dark (centered outcomes only) |
| `short-laptop-light` | 1280×720 | light (centered outcomes only) |

Snapshot files live next to each spec under `tests/visual/*-snapshots/{projectName}/` and are **tracked in git**.

### Reading test output

When a screenshot comparison runs, Playwright compares three images:

- **Expected** — the committed baseline PNG from the last `test:visual:update` (or initial generation).
- **Actual** — what Chromium rendered during this run (saved under `test-results/` on failure).
- **Diff** — a highlighted overlay showing pixel differences between expected and actual (also under `test-results/` on failure).

A passing test means actual matches expected within Playwright’s default pixel tolerance. A failing test prints the paths to actual and diff images; open them side by side, or run `npm run test:visual:ui` to inspect in the Playwright UI. If the new rendering is correct, run `npm run test:visual:update` to accept the new baselines.

On failure, an HTML report is written to `playwright-report/` (opened automatically in the browser when a run fails locally). Traces are retained under `test-results/` for failed tests.

### Manual preview URLs (port 4173)

When running `npm run dev -- --port 4173`, replace `localhost:5173` in the tables above with `127.0.0.1:4173`.
