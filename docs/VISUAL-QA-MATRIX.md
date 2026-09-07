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
