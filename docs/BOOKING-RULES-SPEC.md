# Booking rules and calendar reliability

## Human summary

CloudMeet should offer interviews only from 48 hours ahead through the following two weeks, allow at most one booking per Pacific date, and treat a booked date as used even if the booking is canceled. Google Calendar’s primary calendar is the source for whole-day blackouts: an all-day event or any event overlapping availability blocks that entire date, including events marked Free.

Calendar trouble is visible to bookers and alerts AL. CloudMeet distinguishes a calendar outage from a day with no open slots, and the scheduled health check verifies that it can read Google primary after refreshing access. Host SMS on a new booking is a lower-priority reach goal.

The critical token-verification issue is closed after a passing run. The fail-closed calendar bug in issue #10 is implemented locally: Google Calendar verification failures no longer become empty/free availability. The production deployment test gate in issue #8 remains open. A successful reschedule releases its original date and applies the normal rules to its destination date.

## Machine-readable notes

### Booking window

- Let `t0` be the server time when availability is requested.
- A meeting start is eligible when `start >= t0 + 48 hours` and `start < t0 + 16 * 24 hours`. This is a rolling range of 14 days beginning 48 hours ahead; the upper bound is exclusive.
- Recalculate and enforce the window when the booking is submitted, so a stale page or cached slot cannot bypass it.
- A reschedule target must satisfy the same window. When a reschedule succeeds, release the vacated source date and reserve the destination date under the same cap and calendar rules.

### Per-date booking cap

- Use `America/Los_Angeles` for the host’s Pacific calendar date. Group by the appointment’s start date in that zone.
- Permit at most one CloudMeet booking per host-local date across all bookers and event types.
- Once a booking is accepted, keep that date unavailable for the rest of that date even if the attendee or host later cancels. Persist the reservation history so deleting the Google event or changing the booking status cannot reopen the date.
- Enforce the cap at the database write boundary so concurrent booking requests cannot both claim one date.
- A successful reschedule reopens its original Pacific date; the destination consumes its Pacific date. A standalone cancellation keeps its original date blocked.

### Calendar conflicts and whole-day blackouts

- For whole-day blackout decisions, inspect Google Calendar’s primary calendar only.
- Block the entire Pacific date if the primary calendar has any non-canceled all-day event, or any non-canceled timed event that overlaps a configured availability interval on that date.
- Count events marked `transparency: transparent` / Free. FreeBusy alone is insufficient for this rule because it omits transparent events; read event records for the primary calendar.
- A timed event entirely outside configured availability intervals does not trigger a whole-day blackout. An all-day event blocks the date regardless of its title, transparency, or configured hours.
- Other selected calendars keep the existing interval-overlap behavior. The whole-day blackout rule does not expand to those calendars.
- Treat Google lookup errors, per-calendar FreeBusy errors, missing required FreeBusy results, and missing access as unverifiable state: return no bookable availability and reject booking submission.
- Revalidate configured Google availability calendars at booking submission, not only when displaying slots. This revalidation happens before creating the invite calendar event or inserting the confirmed booking row. Outlook behavior is unchanged.

### Failure UX and monitoring

- Distinguish “availability temporarily unavailable because the calendar could not be checked” from a valid date with zero available slots. Day and month availability return HTTP 503 with machine-readable `code: "calendar_unavailable"` and do not cache outage responses as empty availability.
- The public booking page shows a distinct temporary-unavailable state for calendar outages, separate from normal empty-day/month copy.
- The existing five-minute cron probe makes a real authenticated read against the primary Calendar API after refreshing access; refreshing the OAuth token alone is not sufficient evidence of calendar access.
- Send a Healthchecks.io failure signal when the scheduled primary-calendar read fails. Public availability and booking-submission Google read failures also call the configured `HEALTHCHECK_URL` `/fail` URL, so transient failures do not depend on the next probe.
- On scheduled recovery, the five-minute worker sends a normal success signal and clears the host-facing warning state.
- The repository records the existing Healthchecks.io alert email as `alabut@gmail.com`. Its documented period was one day with a one-hour grace period; verify the live setting and align it with the five-minute worker cadence before calling monitoring complete.
- Live Healthchecks period, grace, and recipient settings remain unverified unless the repo can prove them. The application does not call the Healthchecks API to configure account settings.
- The dashboard’s current token warning is useful but only runs when the dashboard is loaded; it does not replace scheduled checks and host alerts.

### Email and SMS

- Current guest confirmation is the Google Calendar event invitation (`sendUpdates=all`). CloudMeet has no configured transactional email/reminder provider. Google Calendar reminders are controlled by each recipient and are not guaranteed by CloudMeet.
- Reach goal: send AL an actual SMS immediately after a booking is confirmed. Do not use Telegram. Investigate provider, U.S. A2P 10DLC registration, and costs before selecting or enabling a service. No SMS provider or credentials are selected/configured.
- Provider research: [Twilio A2P 10DLC](https://www.twilio.com/docs/messaging/compliance/a2p-10dlc), [Twilio U.S. SMS pricing](https://www.twilio.com/en-us/sms/pricing/us), [Telnyx messaging pricing](https://telnyx.com/pricing/messaging), and [Telnyx 10DLC fees](https://support.telnyx.com/en/articles/5634625-10dlc-fees-and-charges).

### Existing blockers and evidence

- Issue #7 is closed after verification run [37370894615](https://github.com/alabut/CloudMeet/actions/runs/37370894615) passed “Verify token and deployment resource access” on 2026-10-05. AL had reported completing Cloudflare Roll and updating the GitHub deployment secret. No deployment was performed.
- Review and merge the local fix for bug [#10](https://github.com/alabut/CloudMeet/issues/10) before implementing feature [#11](https://github.com/alabut/CloudMeet/issues/11), following the repository’s zero-known-bugs policy.
- Host SMS is a lower-priority reach goal tracked separately in [#12](https://github.com/alabut/CloudMeet/issues/12).
- The automated production deployment gate remains tracked in [#8](https://github.com/alabut/CloudMeet/issues/8). Do not deploy this feature without that gate or an explicit release decision.
