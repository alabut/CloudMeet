[mc project=cloudmeet thread=2026-10-05-booking-rules]
===== CLAUDE HANDOFF =====

Paste this file into a fresh Claude Code session opened in /Users/alabut/Developer/CloudMeet. It carries the current implementation state and AL's decisions so the incoming driver can finish the review without repeating discovery.

## Goal

Finish review and publication preparation for the local CloudMeet calendar-safety issue #10 and booking-rules feature #11 implementation. Enforce a rolling start window of now + 48 hours through, but excluding, now + 16 days; allow at most one CloudMeet booking per host-local Pacific date; keep canceled dates frozen; release the original date only after a successful cross-date reschedule; and let Google primary events block an entire Pacific date when all-day or when a timed event overlaps any configured availability interval. Keep calendar-verification failures closed, visible to bookers, and reported to the host watchdog. Do not deploy.

## Repo / cwd

/Users/alabut/Developer/CloudMeet
Current branch: fix/calendar-fails-closed
HEAD: fd00a03 Implement booking date rules for issue 11

The branch has no remote tracking branch as last checked. No fetch, pull, push, merge, or deployment was performed during this continuation.

## Already true

- AL's confirmed booking rules are recorded in docs/BOOKING-RULES-SPEC.md and GitHub issue #11:
  - Eligible start times satisfy start >= server now + 48 hours and start < server now + 16 days. Recompute the window on availability and final booking/reschedule/proposal acceptance.
  - Daily limit is one CloudMeet meeting per America/Los_Angeles start date, across attendees and event types.
  - A confirmed booking keeps its Pacific date consumed after cancellation. A successful cross-date reschedule releases the source date and consumes the destination date. A pending proposal holds its destination while the booking retains its source; declining/canceling/expiring a proposal releases its destination hold.
  - Google primary alone drives whole-day blackouts regardless of selected-calendar settings. Every non-canceled all-day event blocks its Pacific date range, including events marked Free. A timed event blocks its Pacific date if it overlaps any configured availability interval, including events marked Free. Selected secondary calendars keep ordinary interval conflict behavior.
  - If Google calendar state cannot be verified, withhold times/reject the booking and show an outage state. Per-day override UI is deferred; a primary-calendar all-day event is the manual override.
- AL clarified the one-meeting-per-day timezone as Pacific and chose Google primary for whole-day blackouts.
- Issue #7 is closed. Verification run 37370894615 passed on 2026-10-05.
- Open GitHub issues at last read: #8 production test gate (improvement), #10 calendar fail-closed and watchdog verification (bug; implementation local but live watchdog settings unverified), #11 booking rules (feature; implementation local and unmerged), #12 optional SMS research/decision (feature). Keep #8, #10, #11, and #12 open while their remaining acceptance/deployment decisions are unresolved.
- The five-minute cron health path and primary Events API read are implemented locally. Public availability and booking failures signal the Healthchecks.io endpoint; live Healthchecks period/grace/recipient/alert path and Pages secret availability have not been verified. The app can therefore fail closed while live monitoring still needs operational confirmation.
- Guest confirmation/update/cancellation comes from Google Calendar invitations. CloudMeet Emailit templates/reminders require EMAILIT_API_KEY, documented as not configured; Google reminder settings belong to each invitee.
- SMS is a reach goal, not part of this implementation. Issue #12 has a dated official pricing comparison for Twilio and Telnyx. No provider is chosen, no number/account is provisioned, and no charges were incurred.
- The production deployment test gate remains absent and tracked by issue #8. Migration 0009_booking_date_reservations.sql is required for date reservations. Never deploy without the gate or a separate release decision from AL.
- AL's standing permission allows committing and pushing verified work in this repository. Pull before pushing; do not force-push, reset, push to main, or deploy. Only commit changes whose provenance is clear.
- Do not inspect, print, or store credentials; do not inspect .dev.vars, use production D1, or perform live bookings.

## Done so far

- The prior commits on this branch are:
  - c31aad6 fix: fail closed on calendar verification errors
  - 62d9ed7 fix: surface calendar verification outages
  - fd00a03 Implement booking date rules for issue 11
- This continuation reviewed the booking/reschedule lifecycle and added fixes for request-start window consistency, malformed Calendar response handling, proposal/cancellation/reschedule races, stale proposal holds, cross-calendar blackout revalidation, and preserving per-date reservations.
- A read-only audit was run. Its malformed FreeBusy finding was already fixed in the current tree and has a regression test. Three of its other findings were then fixed: direct reschedule now adopts its own pending proposal date hold; reservation-date 409 errors are preserved instead of turned into calendar outages; and monthly Google busy-time queries use Pacific month bounds.
- New focused regression coverage was written first; the two new source-contract tests failed before the fixes and passed afterward.
- Exact verification after these changes: npm run test:calendar-fail-closed — 28 tests passed, 0 failed. Expected mock failure-path logs appeared. No build or production checks were run.
- Current modified files:
  - docs/BOOKING-RULES-SPEC.md
  - docs/BREAKPOINT.md
  - src/lib/server/booking-rules.ts
  - src/lib/server/google-calendar.ts
  - src/lib/server/primary-calendar-blackouts.ts
  - src/routes/api/availability/+server.ts
  - src/routes/api/availability/month/+server.ts
  - src/routes/api/bookings/+server.ts
  - src/routes/api/bookings/cancel/+server.ts
  - src/routes/api/bookings/propose-reschedule/+server.ts
  - src/routes/api/bookings/reschedule/+server.ts
  - src/routes/cancel/[id]/+page.server.ts
  - src/routes/reschedule-response/[token]/+page.server.ts
  - tests/regression/calendar-fail-closed.test.mjs
- docs/BREAKPOINT.md was already modified by an earlier agent before this continuation. Preserve it and inspect its provenance/content; do not stage it blindly or include it as this driver's own change.
- No changes were deployed or pushed. Current code and spec changes remain uncommitted.

## Remaining work (ordered)

1. Re-read the governing files before editing: AGENTS.md, CLAUDE.md, docs/ORCHESTRATION.md, docs/BREAKPOINT.md, and docs/BOOKING-RULES-SPEC.md. Review the complete working diff, especially the newest reservation-transfer batch logic in src/routes/api/bookings/reschedule/+server.ts, the 409 handling around Calendar event creation, and the Pacific month range in src/routes/api/availability/month/+server.ts. Audit for D1 batch ordering/guards and race outcomes.
2. Run git diff --check (not yet rerun after the latest edits). The focused regression suite already passed after the latest code edits; rerun it only if code changes or the review identifies a reason. Do not run npm run build: the prior implementation brief deferred/prohibited it. Do not seed local D1 or use production data.
3. Resolve any concrete review finding with test-first regression coverage. Keep any edits limited to issues #10/#11 and update the canonical rule/spec document only for factual discrepancies.
4. Confirm that issue comments/status accurately reflect local implementation and the remaining live-monitoring/release checkpoints. Do not close #10 or #11 while operational validation/review/merge/deploy remains. SMS pricing research is complete, but keep #12 open for AL's implementation/provider decision.
5. Before any authorized feature-branch push, fetch/pull origin/main first, inspect the resulting merge, and stop if conflicts are unsafe. Commit only reviewed changes with clear provenance; do not include docs/BREAKPOINT.md unless its origin is reviewed and AL's ownership is clear. A feature-branch push must not target main and must not trigger deployment; verify workflow conditions before pushing. Never deploy.
6. Leave the live Healthchecks/Cloudflare setting check for an authorized session with the required account access. Report precisely which cadence and alert settings remain unverified rather than claiming monitoring is complete.

## Do not do

- Do not deploy, push to main, modify production settings, run real bookings, or touch production D1.
- Do not inspect or print secrets, especially .dev.vars or Cloudflare/GitHub credentials.
- Do not run the legacy upstream-sync workflows.
- Do not implement the deferred per-day override UI or start SMS provider setup/charges during this pass.
- Do not stage or commit another agent's uncommitted docs/BREAKPOINT.md change without first reviewing its provenance.
- Do not close issue #8, #10, #11, or #12 prematurely.

## Verify

- Already passed after the latest code edits: npm run test:calendar-fail-closed (28/28).
- Next hygiene check: git diff --check.
- If code changes, rerun npm run test:calendar-fail-closed. Do not run npm run build under the prior brief.
- Before publishing, inspect git status and diff, pull origin/main before pushing, verify branch/workflow conditions, and keep deployment disabled.

## Key paths

- /Users/alabut/Developer/CloudMeet/AGENTS.md
- /Users/alabut/Developer/CloudMeet/CLAUDE.md
- /Users/alabut/Developer/CloudMeet/docs/ORCHESTRATION.md
- /Users/alabut/Developer/CloudMeet/docs/BREAKPOINT.md
- /Users/alabut/Developer/CloudMeet/docs/BOOKING-RULES-SPEC.md
- /Users/alabut/Developer/CloudMeet/src/lib/server/booking-rules.ts
- /Users/alabut/Developer/CloudMeet/src/lib/server/google-calendar.ts
- /Users/alabut/Developer/CloudMeet/src/lib/server/primary-calendar-blackouts.ts
- /Users/alabut/Developer/CloudMeet/src/routes/api/availability/+server.ts
- /Users/alabut/Developer/CloudMeet/src/routes/api/availability/month/+server.ts
- /Users/alabut/Developer/CloudMeet/src/routes/api/bookings/+server.ts
- /Users/alabut/Developer/CloudMeet/src/routes/api/bookings/propose-reschedule/+server.ts
- /Users/alabut/Developer/CloudMeet/src/routes/api/bookings/reschedule/+server.ts
- /Users/alabut/Developer/CloudMeet/src/routes/reschedule-response/[token]/+page.server.ts
- /Users/alabut/Developer/CloudMeet/tests/regression/calendar-fail-closed.test.mjs
- /Users/alabut/Developer/CloudMeet/migrations/0009_booking_date_reservations.sql
- /Users/alabut/Developer/CloudMeet/src/routes/api/cron/health/+server.ts
- /Users/alabut/Developer/CloudMeet/workers/cron-reminders/worker.js
- GitHub issues #8, #10, #11, and #12 in alabut/CloudMeet.

## Continuity notes

- The read-only auditor may have inspected an earlier snapshot: its malformed-errors finding is stale for the current tree, and the current regression suite proves the malformed errors object is rejected. The other three findings were addressed after the audit, then the suite passed.
- The static regression test for the direct reschedule path verifies the reservation transfer SQL and the 409 rethrow source shape; review the actual batch semantics independently before calling the race handling complete.
- The workflow/deployment state was previously checked: only push to main deploys. Reconfirm current workflow rules before any push, because branch state and workflows can change.
- An active local usage receipt for this Codex session was checkpointed before this file was written: /Users/alabut/Developer/automation-scripts/projects/orchestration/session-receipts/2026-10-05-145756-codex-codex-session-01a10dd5-3c3.json. The one-day project report had no finalized per-stretch receipt yet, so exact written/re-read totals and five-hour/weekly quota points were unavailable at handoff authoring time.

## Why split this conversation

This is a quota-driven driver switch requested by AL because the five-hour and weekly Codex allowances were nearly exhausted. Claude should complete the remaining code review and publication preparation while preserving the completed discovery and avoiding repeated repository research. The split is worthwhile if Claude validates the final diff and tests, then leaves a clean, reviewable feature branch with honest issue/watchdog status and no deployment.

===== END HANDOFF =====

Paste this document into a new Claude Code session opened in /Users/alabut/Developer/CloudMeet; it captures the current state and the checks that remain.
