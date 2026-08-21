# Style Map

Anchor comments marking the places you'll most likely want to restyle by hand.
Search the repo for `USER STYLE ANCHOR` to jump straight to any of these.

| Anchor | File | Controls |
|---|---|---|
| `global-css-entry` | [src/app.css](../src/app.css) | Tailwind base/components/utilities import — the single entry point for all global styling |
| `theme-tokens` | [src/app.css](../src/app.css) | CSS custom properties (`--color-primary`, `--color-primary-hover`) used as Tailwind theme extensions |
| `booking-page-layout-wrapper` | [src/routes/[slug]/+page.svelte](<../src/routes/[slug]/+page.svelte>) | Outermost container for the public booking page — page background, centering, and the per-booking brand-color CSS variables (`--brand-color`, `--brand-light`, etc.) that cascade into every child component below |
| `availability-slot-picker` (calendar) | [src/lib/components/booking/BookingCalendar.svelte](../src/lib/components/booking/BookingCalendar.svelte) | Month calendar grid — day cells, available/unavailable states, selected-date highlight |
| `availability-slot-picker` (time slots) | [src/lib/components/booking/TimeSlotList.svelte](../src/lib/components/booking/TimeSlotList.svelte) | The list of bookable time buttons shown once a date is picked (desktop layout) |
| `booking-form` | [src/lib/components/booking/BookingForm.svelte](../src/lib/components/booking/BookingForm.svelte) | Name/email/notes form shown after a time slot is confirmed (desktop layout) |
| `confirmation-view` | [src/lib/components/booking/BookingSuccess.svelte](../src/lib/components/booking/BookingSuccess.svelte) | "You are scheduled" success screen shown after a booking is created |

## Notes for your restyle pass

- **Brand color is dynamic, not hardcoded.** The host sets a `brand_color` in the dashboard (Profile section), and `[slug]/+page.svelte` derives a full palette from it (`createBrandColors()` in [src/lib/utils/colorUtils.ts](../src/lib/utils/colorUtils.ts)) and exposes it as CSS variables (`--brand-color`, `--brand-light`, `--brand-lighter`, `--brand-dark`, `--brand-rgb`) on the layout wrapper anchor. Components below reference these variables inline rather than Tailwind color classes, so a lot of "branding" restyling happens by editing `colorUtils.ts` rather than component markup.
- **Mobile and desktop are two separate markup trees**, not one responsive layout — both live inside `src/routes/[slug]/+page.svelte`, gated by `md:hidden` / `hidden md:flex`. If you restyle the booking flow, check both: the mobile tree (full-page, step-based: calendar → times → form) has its own inline slot-picker and form markup that does NOT go through `TimeSlotList.svelte` / `BookingForm.svelte` — those two components are desktop-only. The confirmation screen (`BookingSuccess.svelte`) is shared by both.
- The dashboard (host-facing, behind login) is a separate area under `src/routes/dashboard/` — not anchored here since the prompt scoped this pass to the public booking flow. Say the word if you also want anchors there.
