# Bugs

Confirmed defects awaiting fixes. Distinct from [TWEAKS.md](TWEAKS.md), which holds optional and forward-looking work — everything here is something that is broken now and blocks sharing the app.

Found during live testing on a real iPhone (iOS Safari) and desktop against https://schedule.alabut.com on 2026-08-21/22.

## Blocking — mobile

- [x] **Availability time fields render invisible.** FIXED (87954ce) — D1 returned times as `"9:00"` / `"09:00:00"`; `<input type="time">` silently renders blank unless given zero-padded `HH:MM`. Normalized on load. Original: On `/dashboard/availability`, the from/to time inputs appear completely blank on mobile — no value, no placeholder, no visible text. Tapping one reveals the native iOS time picker with a value already set (9:00 AM), so the data is present and saved; it simply isn't rendering. Likely a text-color-versus-background problem or the native `<input type="time">` control not painting its value on iOS. File: `src/routes/dashboard/availability/+page.svelte`.

- [x] **Week starts on Monday; should start on Sunday.** FIXED (75b4297) — display-only change to the booking calendar; the availability editor was already Sunday-first. Stored `day_of_week` values untouched. Original: The availability editor and the booking calendar both order days Monday→Sunday. US convention is Sunday→Saturday. Affects `src/routes/dashboard/availability/+page.svelte` and `src/lib/components/booking/BookingCalendar.svelte` — check both, and check any day-of-week ordering in availability calculation so the display change doesn't desync from the stored `day_of_week` values.

- [x] **Booking page still overflows the viewport.** FIXED (f7aea9a) — was never real overflow. iOS Safari auto-zooms on focusing any control under 16px and never zooms back out, so the zoom followed you across pages. 14 form controls were 14px; a base rule now enforces a 16px floor. Verified `scrollWidth === 375` with zero sub-16px inputs. Original: `/[slug]` now loads at the top correctly (fixed previously), but content is still wider than the phone screen and produces a horizontal scrollbar.

- [x] **Reschedule page content too wide / appears zoomed.** FIXED (f7aea9a) — same iOS auto-zoom root cause as above. Original: Content extends past the viewport. Pinching out snaps it into place, which indicates the page is not genuinely oversized — Safari is zoomed in and staying that way. Strongly suspected cause: iOS Safari auto-zooms when a form input with font-size under 16px is focused and never zooms back out. See the zoom research note below.

- [x] **General: every page must be mobile-first.** Audited all 25 route and component files. No genuine CSS horizontal overflow was found anywhere — every reported "too wide" symptom traced back to the iOS auto-zoom above. Original: Rather than fixing these one at a time, audit every route and component for 375px correctness in a single pass and fix everything found, including issues not listed here.

## Blocking — attendee flow

- [x] **Rescheduled bookings lose their reschedule/cancel links.** FIXED (48b6668) — description building centralized in `src/lib/server/calendar-event-description.ts` and used by all four paths that write calendar events, including the host-proposal accept flow which had the same bug plus malformed API arguments. Booking id is preserved across reschedules (`UPDATE ... WHERE id = ?`), so the URLs stay valid indefinitely. Original: The original booking's calendar invitation correctly contains `Reschedule:` and `Cancel:` URLs in the body. The updated invitation sent after a reschedule does NOT. An attendee can therefore reschedule exactly once and is then stuck. Links must survive every reschedule, indefinitely — the booking id does not change, so the same URLs remain valid and simply need to be re-appended to the updated event description. File: `src/routes/api/bookings/reschedule/+server.ts`.

## Desktop

- [x] **Time-slot confirm buttons clipped.** FIXED (60967d2) — missing `min-h-0` on the flex column let the scroll area push the actions past the card edge. Original: On the desktop booking page, after selecting a time, the confirm/Next buttons at the bottom right of the slot column are cut off by the card's bottom edge. File: `src/routes/[slug]/+page.svelte` (desktop tree) and/or `src/lib/components/booking/TimeSlotList.svelte`.

## Notes

- **iOS input auto-zoom** is the leading theory for the "too wide until I pinch" symptom. Safari zooms the viewport when a control with computed font-size below 16px receives focus, and does not restore the zoom afterward, so subsequent pages inherit the zoomed state. The fix is to ensure form controls are 16px or larger — *not* to add `maximum-scale=1` or `user-scalable=no` to the viewport meta, which disables pinch-zoom for everyone and fails WCAG 2.1 SC 1.4.4.

## Found during verification

- [x] **Availability day-of-week off by one in UTC-negative timezones.** FIXED (e0c4437). The per-day slots endpoint parsed `YYYY-MM-DD` with `new Date(date)` — which is UTC midnight — then read the weekday back with `.getDay()` in local time, reporting the previous day. The month-grid endpoint used the local `new Date(y, m, d)` constructor, so the two endpoints disagreed: the calendar showed a day as bookable and the day view offered no times. Locally (Pacific) this made every Monday unbookable. Masked in production because Cloudflare Workers run with `TZ=UTC`, where both forms agree — latent, not absent. This is a strong candidate for the "clickable day with no available times" symptom reported earlier.

## Open / needs confirmation on production

- [ ] **Confirm the offered slots are correct on the live site** after setting timezone and hours there. Local and production have separate databases.
- [ ] One local date (2026-08-31) still showed as bookable in the month grid while returning zero slots. Most likely a stale 5-minute KV cache entry populated before the fix above, but it was not conclusively re-tested after the TTL expired. Worth a look if the symptom reappears on production.
