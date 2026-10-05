# Booking rules and calendar reliability

## Human summary

CloudMeet should offer interviews only from 48 hours ahead through the following two weeks, allow at most one booking per Pacific date, and treat a booked date as used even if the booking is canceled. Google Calendar’s primary calendar is the source for whole-day blackouts: an all-day event or any event overlapping availability blocks that entire date, including events marked Free.

Calendar trouble must be visible to bookers and alert AL. CloudMeet should distinguish a calendar outage from a day with no open slots, and the scheduled health check must verify that it can read the calendar. Host SMS on a new booking is a lower-priority reach goal. No application changes or provider setup have been made.

The critical token-verification issue is closed after a passing run. Implementation must first fix the open fail-closed calendar bug in issue #10. The production deployment test gate in issue #8 also remains open. A successful reschedule releases its original date and applies the normal rules to its destination date.

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
- Treat Google primary-calendar lookup errors, per-calendar errors, and missing access as unverifiable state: return no bookable availability and reject booking submission.
- Revalidate external calendar availability at booking submission, not only when displaying slots.

### Failure UX and monitoring

- Distinguish “availability temporarily unavailable because the calendar could not be checked” from a valid date with zero available slots. Do not silently render either free slots or a normal empty-calendar state after lookup failure.
- Extend the existing five-minute cron probe to make a real authenticated read against the primary Calendar API; refreshing the OAuth token alone is not sufficient evidence of calendar access.
- Send a Healthchecks.io failure signal when the scheduled primary-calendar read fails. Send a failure signal for primary-calendar read failures observed during public availability or booking requests as well, so transient failures do not depend on the next probe.
- On recovery, send a success signal and clear the host-facing warning state.
- The repository records the existing Healthchecks.io alert email as `alabut@gmail.com`. Its documented period was one day with a one-hour grace period; verify the live setting and align it with the five-minute worker cadence before calling monitoring complete.
- The dashboard’s current token warning is useful but only runs when the dashboard is loaded; it does not replace scheduled checks and host alerts.

### Email and SMS

- Current guest confirmation is the Google Calendar event invitation (`sendUpdates=all`). CloudMeet has no configured transactional email/reminder provider. Google Calendar reminders are controlled by each recipient and are not guaranteed by CloudMeet.
- Reach goal: send AL an actual SMS immediately after a booking is confirmed. Do not use Telegram. Investigate provider, U.S. A2P 10DLC registration, and costs before selecting or enabling a service. No SMS provider or credentials are selected/configured.
- Provider research: [Twilio A2P 10DLC](https://www.twilio.com/docs/messaging/compliance/a2p-10dlc), [Twilio U.S. SMS pricing](https://www.twilio.com/en-us/sms/pricing/us), [Telnyx messaging pricing](https://telnyx.com/pricing/messaging), and [Telnyx 10DLC fees](https://support.telnyx.com/en/articles/5634625-10dlc-fees-and-charges).

### Existing blockers and evidence

- Issue #7 is closed after verification run [37370894615](https://github.com/alabut/CloudMeet/actions/runs/37370894615) passed “Verify token and deployment resource access” on 2026-10-05. AL had reported completing Cloudflare Roll and updating the GitHub deployment secret. No deployment was performed.
- Fix bug [#10](https://github.com/alabut/CloudMeet/issues/10) before implementing feature [#11](https://github.com/alabut/CloudMeet/issues/11), following the repository’s zero-known-bugs policy.
- Host SMS is a lower-priority reach goal tracked separately in [#12](https://github.com/alabut/CloudMeet/issues/12).
- The automated production deployment gate remains tracked in [#8](https://github.com/alabut/CloudMeet/issues/8). Do not deploy this feature without that gate or an explicit release decision.
