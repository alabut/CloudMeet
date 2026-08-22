# Bugs

Confirmed defects awaiting fixes. Distinct from [TWEAKS.md](TWEAKS.md), which holds optional and forward-looking work — everything here is something that is broken now and blocks sharing the app.

Found during live testing on a real iPhone (iOS Safari) and desktop against https://schedule.alabut.com on 2026-08-21/22.

## Blocking — mobile

- [ ] **Availability time fields render invisible.** On `/dashboard/availability`, the from/to time inputs appear completely blank on mobile — no value, no placeholder, no visible text. Tapping one reveals the native iOS time picker with a value already set (9:00 AM), so the data is present and saved; it simply isn't rendering. Likely a text-color-versus-background problem or the native `<input type="time">` control not painting its value on iOS. File: `src/routes/dashboard/availability/+page.svelte`.

- [ ] **Week starts on Monday; should start on Sunday.** The availability editor and the booking calendar both order days Monday→Sunday. US convention is Sunday→Saturday. Affects `src/routes/dashboard/availability/+page.svelte` and `src/lib/components/booking/BookingCalendar.svelte` — check both, and check any day-of-week ordering in availability calculation so the display change doesn't desync from the stored `day_of_week` values.

- [ ] **Booking page still overflows the viewport.** `/[slug]` now loads at the top correctly (fixed previously), but content is still wider than the phone screen and produces a horizontal scrollbar.

- [ ] **Reschedule page content too wide / appears zoomed.** Content extends past the viewport. Pinching out snaps it into place, which indicates the page is not genuinely oversized — Safari is zoomed in and staying that way. Strongly suspected cause: iOS Safari auto-zooms when a form input with font-size under 16px is focused and never zooms back out. See the zoom research note below.

- [ ] **General: every page must be mobile-first.** Rather than fixing these one at a time, audit every route and component for 375px correctness in a single pass and fix everything found, including issues not listed here.

## Blocking — attendee flow

- [ ] **Rescheduled bookings lose their reschedule/cancel links.** The original booking's calendar invitation correctly contains `Reschedule:` and `Cancel:` URLs in the body. The updated invitation sent after a reschedule does NOT. An attendee can therefore reschedule exactly once and is then stuck. Links must survive every reschedule, indefinitely — the booking id does not change, so the same URLs remain valid and simply need to be re-appended to the updated event description. File: `src/routes/api/bookings/reschedule/+server.ts`.

## Desktop

- [ ] **Time-slot confirm buttons clipped.** On the desktop booking page, after selecting a time, the confirm/Next buttons at the bottom right of the slot column are cut off by the card's bottom edge. File: `src/routes/[slug]/+page.svelte` (desktop tree) and/or `src/lib/components/booking/TimeSlotList.svelte`.

## Notes

- **iOS input auto-zoom** is the leading theory for the "too wide until I pinch" symptom. Safari zooms the viewport when a control with computed font-size below 16px receives focus, and does not restore the zoom afterward, so subsequent pages inherit the zoomed state. The fix is to ensure form controls are 16px or larger — *not* to add `maximum-scale=1` or `user-scalable=no` to the viewport meta, which disables pinch-zoom for everyone and fails WCAG 2.1 SC 1.4.4.
