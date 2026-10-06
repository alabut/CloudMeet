# Booking rules and calendar reliability

## Human summary

CloudMeet offers interviews only from 48 hours ahead through the following two weeks, allows at most one appointment per Pacific date, and reopens a date when its booking is canceled. Google Calendar’s primary calendar is the source for whole-day blackouts: an all-day event or any event overlapping availability blocks that entire date, including events marked Free.

Calendar outages are visible to bookers, and the five-minute worker checks Google primary through the Events API read used for blackout detection. The live Healthchecks timing and request-level alert path still need verification. Host SMS on a new booking is a lower-priority reach goal.

The critical token-verification issue is closed after a passing run. The fail-closed calendar bug in issue #10 is implemented locally: Google Calendar verification failures no longer become empty/free availability. Issue #11 is implemented locally with a D1 date-reservation table and application-level Pacific date computation for legacy rows. The production deployment test gate in issue #8 remains open. A successful reschedule releases its original date only after the destination is reserved and the booking update succeeds.

## Machine-readable notes

### Booking window

- Let `t0` be the server time when availability is requested.
- A meeting start is eligible when `start >= t0 + 48 hours` and `start < t0 + 16 * 24 hours`. This is a rolling range of 14 days beginning 48 hours ahead; the upper bound is exclusive.
- Recalculate and enforce the window on every public day/month availability request and again when a booking, direct reschedule, or proposal acceptance is submitted.
- Public day/month availability responses are not served from KV because the 48-hour edge moves continuously and a 60-second cached response could expose stale slots or dates.
- A reschedule target must satisfy the same window. When a reschedule succeeds, reserve the destination date and release the vacated source date only after the booking update succeeds.

### Per-date booking cap

- Use `America/Los_Angeles` for the host’s Pacific calendar date. Group by the appointment’s start date in that zone.
- Permit at most one CloudMeet booking per host-local date across all bookers and event types.
- A confirmed booking keeps its date unavailable. If the attendee or host cancels it, release the date so someone else can book it. (AL reversed the earlier "canceled dates stay used" rule on 2026-10-05 after local testing.)
- Enforce the cap at the database write boundary with `booking_date_reservations`: one active reservation per `(user_id, pacific_date)`, backed by a partial unique index where `released_at IS NULL`.
- Preserve occupied dates from legacy non-canceled booking rows by computing their Pacific start dates in application code. Do not rely on SQLite/D1 to calculate `America/Los_Angeles` dates from UTC strings.
- A host or attendee cancellation, including an attendee declining a proposal (which cancels the booking), releases every reservation that booking holds.
- A pending host reschedule proposal keeps the source date consumed and also reserves the proposed destination date while pending.
- If the host cancels or directly reschedules a booking while proposals are pending, invalidate those proposals and release their destination holds. When a direct reschedule selects a date already held by one of that booking's proposals, transfer that active reservation to the booking instead of creating a duplicate claim.
- A successful direct reschedule or accepted proposal moves the reservation to the destination date and releases the source only after the operation succeeds. A failed proposal releases only the proposed destination and must not free the source.

### Calendar conflicts and whole-day blackouts

- For whole-day blackout decisions, inspect Google Calendar’s primary calendar only, through Events API reads rather than FreeBusy.
- Block the entire Pacific date if the primary calendar has any non-canceled all-day event, or any non-canceled timed event that overlaps a configured availability interval on that date.
- Count events marked `transparency: transparent` / Free. FreeBusy alone is insufficient for this rule because it omits transparent events; read event records for the primary calendar.
- A timed event entirely outside configured availability intervals does not trigger a whole-day blackout. An all-day event blocks the date regardless of its title, transparency, or configured hours.
- Other selected calendars keep the existing interval-overlap behavior. The whole-day blackout rule does not expand to those calendars.
- Treat primary Events API lookup errors, Google lookup errors, per-calendar FreeBusy errors, missing required FreeBusy results, and missing access as unverifiable state: return no bookable availability and reject booking submission.
- Revalidate configured Google availability calendars at booking submission, not only when displaying slots. This revalidation happens before creating the invite calendar event or inserting the confirmed booking row. Outlook behavior is unchanged.

### Failure UX and monitoring

- Distinguish “availability temporarily unavailable because the calendar could not be checked” from a valid date with zero available slots. Day and month availability return HTTP 503 with machine-readable `code: "calendar_unavailable"` and do not cache outage responses as empty availability.
- The public booking page shows a distinct temporary-unavailable state for calendar outages, separate from normal empty-day/month copy.
- The existing five-minute cron probe performs a real authenticated Events API read of Google primary after refreshing access; refreshing the OAuth token alone is not sufficient evidence of calendar access.
- Send a Healthchecks.io failure signal when the scheduled primary-calendar read fails. Public availability and booking-submission Google read failures also call the configured `HEALTHCHECK_URL` `/fail` URL, so transient failures do not depend on the next probe.
- Request-level pings only reach Healthchecks when `HEALTHCHECK_URL` is present in the Pages environment. The repository deploy workflow currently documents this secret for `cloudmeet-cron`; verify the Pages setting before relying on request-level pings.
- On scheduled recovery, the five-minute worker sends a normal success signal and clears the host-facing warning state.
- The repository records the existing Healthchecks.io alert email as `alabut@gmail.com`. Its documented period was one day with a one-hour grace period; verify the live setting and align it with the five-minute worker cadence before calling monitoring complete.
- Live Healthchecks period, grace, and recipient settings remain unverified unless the repo can prove them. The application does not call the Healthchecks API to configure account settings.
- The dashboard’s current token warning is useful but only runs when the dashboard is loaded; it does not replace scheduled checks and host alerts.

### Email and SMS

- Current guest confirmation is the Google Calendar event invitation (`sendUpdates=all`). CloudMeet has no configured transactional email/reminder provider. Google Calendar reminders are controlled by each recipient and are not guaranteed by CloudMeet.
- Reach goal: send AL an actual SMS immediately after a booking is confirmed. Do not use Telegram. Investigate provider, U.S. A2P 10DLC registration, and costs before selecting or enabling a service. No SMS provider or credentials are selected/configured.
- Provider research snapshot (2026-10-05): Twilio lists U.S. outbound SMS at $0.0083 per segment plus carrier fees, with a U.S. local number at $1.15/month. Its A2P costs depend on brand type and campaign, including brand registration, campaign review, and monthly campaign fees. Telnyx lists U.S. outbound SMS at $0.004 per part plus carrier fees; a local number starts at $1/month plus $0.10/month to enable SMS. Its A2P fees include a $4.50 brand fee, $15 campaign review, and monthly campaign fees that vary by use case. At one host notification per booking, fixed registration and campaign fees matter more than the per-text rate. Verify current eligibility and pricing before choosing either provider. Sources: [Twilio SMS pricing](https://www.twilio.com/en-us/sms/pricing/us), [Twilio A2P fees](https://help.twilio.com/articles/1260803965530-What-pricing-and-fees-are-associated-with-the-A2P-10DLC-service), [Telnyx messaging pricing](https://telnyx.com/pricing/messaging), [Telnyx number pricing](https://telnyx.com/pricing/numbers), and [Telnyx A2P fees](https://support.telnyx.com/en/articles/5634625-10dlc-fees-and-charges).

### Existing blockers and evidence

- Issue #7 is closed after verification run [37370894615](https://github.com/alabut/CloudMeet/actions/runs/37370894615) passed “Verify token and deployment resource access” on 2026-10-05. AL had reported completing Cloudflare Roll and updating the GitHub deployment secret. No deployment was performed.
- Bug [#10](https://github.com/alabut/CloudMeet/issues/10) and feature [#11](https://github.com/alabut/CloudMeet/issues/11) are implemented locally on `fix/calendar-fails-closed` and remain under review. Issue #10 also needs live Pages `HEALTHCHECK_URL` and Healthchecks.io timing/recipient verification; issue #11 is not deployed and requires migration `0009`.
- Host SMS is a lower-priority reach goal tracked separately in [#12](https://github.com/alabut/CloudMeet/issues/12).
- The automated production deployment gate remains tracked in [#8](https://github.com/alabut/CloudMeet/issues/8). Do not deploy this feature without that gate or an explicit release decision.
