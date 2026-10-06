# CloudMeet breakpoint — updated 2026-10-05

The app remains deployed. [GitHub Issues](https://github.com/alabut/CloudMeet/issues) now owns the active backlog; the old bug and tweak documents preserve history. Booking-policy decisions are captured in [BOOKING-RULES-SPEC.md](BOOKING-RULES-SPEC.md), feature #11. Critical token verification passed and issue #7 is closed. Calendar fail-closed bug #10 and booking-rules feature #11 are implemented locally on `fix/calendar-fails-closed`; they still need review/merge/deploy planning. Host SMS is a lower-priority reach goal in issue #12. No production settings changed.

## Machine-readable notes

- No unchecked application bugs were found in the historical lists. This is a backlog review, not a new end-to-end acceptance test.
- Production test gating remains open in [issue #8](https://github.com/alabut/CloudMeet/issues/8).
- AL classified the historical token exposure as critical in [issue #7](https://github.com/alabut/CloudMeet/issues/7). AL reported completing Cloudflare Roll and updating the GitHub deployment secret; verification run [37370894615](https://github.com/alabut/CloudMeet/actions/runs/37370894615) passed on 2026-10-05 and the issue is closed. The check verifies token access to deployment resources; it does not probe the old token or prove write/deployment access. Never print token values.
- Documentation-only publication may use `[skip ci]` to avoid the push-to-main deployment; application changes must not use it.

V1 remains deployed. Public booking design, dashboard functional/visual work, Zoom invites, Google OAuth in production, and the cron watchdog are on `main`. Issue #8 tracks the missing production test gate. Issues #10 and #11 are implemented locally on `fix/calendar-fails-closed`; the booking-policy spec is recorded separately.

Live: https://schedule.alabut.com  
Repo: `/Users/alabut/Developer/CloudMeet` (`origin` = `alabut/CloudMeet`)  
The app code on `main` last deployed successfully from `0df8fa6` on 2026-09-09 Pacific time. Later documentation commits do not imply a new application deployment.

---

## How to resume (this vs a new chat)

Coming back to **this Cursor conversation** is fine. Long threads get summarized, so **this file is the source of truth**, not the scrollback.

- **Infra / Google / cron / Emailit / healthchecks** → this chat (or a new chat that is told to read this file first).
- **Design system practice / further polish** → optional; see `docs/collaboration/001-design-engineering-practice.md`. Public + dashboard design already landed on `main`.

Push to `main` **auto-deploys** Cloudflare Pages + the cron worker (GitHub Actions `deploy.yml`). That is intentional now. Older docs that say “deploy is manual / Actions will create the wrong D1” are **stale**.

---

## What is already true

### Product
- Host calendar = **Google**. Video = **one recurring Zoom Pro URL** (`ZOOM_MEETING_URL` Pages secret). No Zoom API. No Google Meet `conferenceData` on the Google path.
- Outlook/Teams host path exists in code but Al is not using it.
- Bookers never OAuth. They get a **Google Calendar invitation** (guest on Al’s event). Gmail shows a fancy widget; Outlook/Apple/etc. get a normal invite. Reschedule/cancel URLs live in the event description.
- **No Emailit** (and no other transactional mail) for V1. Branded confirmations/reminders/cancel emails are optional later (Resend if ever). Calendar already does invite/update/cancel mail via `sendUpdates=all`.
- Calendar **reminders are per-guest private settings**. You cannot stamp a reliable “email everyone 24h before” onto the invite (`VALARM` / Google `reminders` do not force guest notifications).

### Google Cloud (easy to get lost)
- CloudMeet’s **web** OAuth client is in project **`workspace-mcp`** (`workspace-mcp-504104`), client **CloudMeet (Calendar Scheduler)**, ID starts `332915002877-mkiq…`.
- **`My First Project`** is unrelated (desktop OAuth for laptops, IDs start `707108005068-`). Leave it.
- Consent screen is **External + In production**. Yellow “needs verification” in Verification Center is **noise** — do not submit for review. 1/100 user cap is only people who click `/auth/login` (Al), not bookers.
- Refresh tokens were dying ~7 days because the app was in **Testing**. Production publishing is the fix. After publish, Al **reconnected** at `/auth/login`.
- Branding needs homepage `https://schedule.alabut.com` and privacy `https://schedule.alabut.com/privacy` (page added in-repo).

### Proven live
- Booking `alabut+googleauth@gmail.com`, Mon Sep 7 2026 12:00–12:30 PT: Google invite arrived immediately with Zoom in location + description.
- Older test `alabut+emailtest@…` Sep 7 9am had **no** `google_event_id` (token was dead; UI faked success). Cancelled in dashboard; cancelled rows still **list** until the date passes (by design).
- Host cancel of a booking **without** `google_event_id` cannot call Google. Host cancel of the 12pm booking **would** delete the Google event and notify guests.

### Hardening already on `main`
- Bookings/reschedules **fail (503)** if Google/Outlook cannot create the invite — no fake success.
- Dashboard probes Google token: amber reconnect banner if dead; **green “connected”** line if healthy (after `1eaf4fc`).
- Cron worker (`cloudmeet-cron`, every 5 min) hits `/api/cron/send-reminders` and `/api/cron/health`.
- The scheduled Google health probe now refreshes access and performs an authenticated Events API read of Google primary before reporting healthy. Public day/month availability and booking-submission Google read failures return a machine-readable `calendar_unavailable` outage response; direct Healthchecks pings require `HEALTHCHECK_URL` in Pages, which is not yet verified. Valid empty availability remains a separate public state. Local issue #11 work adds rolling-window enforcement, primary whole-day blackout reads, and D1 Pacific-date reservations; deploy requires migration `0009`. See [BOOKING-RULES-SPEC.md](BOOKING-RULES-SPEC.md).
- Health endpoint can Emailit-alert (unused — no real Emailit keys). Worker now pings optional **`HEALTHCHECK_URL`** (success vs `{url}/fail`) for a watchdog.

### Ops / accounts (no secrets in git)
- Cloudflare account `704537d8106cbc11b76cd2cfdd688acc`, Pages project `cloudmeet`, custom domain `schedule.alabut.com`.
- Workers Free is **100k requests/day**, not 1k/month. Cron ~288/day is fine.
- GitHub Actions secrets exist for deploy: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `APP_URL`, `CRON_SECRET`.
- Pages secrets include Google, JWT, Zoom, etc. **Not** `EMAILIT_*` (placeholders only in local `.dev.vars`).
- Historical Cloudflare API token exposure is tracked as critical in [issue #7](https://github.com/alabut/CloudMeet/issues/7). AL reported rotation on 2026-10-05; see the verification checkpoint above.

---

## Watchdog status (done 2026-09-06)

- Repository notes record the Healthchecks check for **CloudMeet cron** as Simple, period 1 day, grace 1 hour, email to `alabut@gmail.com`; live period, grace, and recipient settings have not been rechecked. The worker runs every 5 minutes, so align the watchdog period/grace with that cadence before calling monitoring complete.
- `HEALTHCHECK_URL` is on GitHub Actions and the live `cloudmeet-cron` worker.
- Request-level Healthchecks pings additionally require the same secret in the Cloudflare Pages environment; this has not been verified.
- Check went **Up**; Al received the test notification email.

## Since then (merged, 2026-09-06 → 2026-09-09)

- Public booking design polish and edge states are on `main`.
- Dashboard visual system, emails-page honesty (“not configured in V1”), accessibility, and Playwright visual QA are on `main`.
- Working tree is clean and matches `origin/main`.

## Recommended next

1. Review and merge the local issue #10/#11 calendar reliability and booking-rules work on `fix/calendar-fails-closed`.
2. Keep [issue #8](https://github.com/alabut/CloudMeet/issues/8), the automated production test gate, in view before any production release; deploy planning must include migration `0009`.
3. Investigate [issue #12](https://github.com/alabut/CloudMeet/issues/12), the optional host SMS alert, after the core booking rules ship.

Other optional product improvements:

1. Hide cancelled bookings: [issue #5](https://github.com/alabut/CloudMeet/issues/5).
2. Optional reminder emails: [issue #4](https://github.com/alabut/CloudMeet/issues/4). Google Calendar invitations stay the guest path. Do not enable Emailit.
3. Rename GCP project: [issue #6](https://github.com/alabut/CloudMeet/issues/6).

Security follow-up: [issue #7](https://github.com/alabut/CloudMeet/issues/7) is closed after the replacement-token verification passed and AL reported Cloudflare Roll. The check does not probe the old secret.

**Do not** enable Emailit. **Do not** click Back to testing in Google Auth Audience.

---

## Files to read first (infra)

- `src/lib/server/google-calendar-health.ts`
- `src/routes/api/cron/health/+server.ts`
- `workers/cron-reminders/worker.js`
- `src/routes/api/bookings/+server.ts` (fail-hard on calendar create)
- `src/lib/server/zoom.ts` / `ZOOM_MEETING_URL`
- `.github/workflows/deploy.yml`

---

## Historical Codex design prompt (already executed)

Do not re-run this. It is kept only as a record of the design session that already merged.

```
Work only on CloudMeet visual/copy design tweaks. Do not touch infrastructure.

Repo: /Users/alabut/Developer/CloudMeet
Live: https://schedule.alabut.com
Branch: create and use `design-tweaks` off current main. Do not merge to main unless Al asks. Pull main first.

Read first:
- docs/BREAKPOINT.md (this pause — infra is owned by another session)
- docs/STYLE-MAP.md
- docs/TWEAKS.md (only the branding/style items; ignore stale deploy/Zoom/Emailit sections if they conflict with BREAKPOINT.md — BREAKPOINT wins)
- Search the repo for `USER STYLE ANCHOR`

Goal: polish the public booking flow (and small dashboard cosmetics if they fall out naturally) so it feels like Al’s site, not stock CloudMeet. Mobile and desktop booking UI are TWO markup trees in src/routes/[slug]/+page.svelte — change both.

Already true:
- Zoom (not Meet) is the join link; don’t revert labels or conferenceData.
- Google Calendar invites are the real confirmation; don’t add Emailit/Resend.
- Push to main auto-deploys; that’s why you stay on a branch.

Do not do:
- OAuth, wrangler, cron, health checks, D1/KV, GitHub Actions, secrets, .dev.vars
- src/routes/api/bookings/+server.ts fail-hard behavior
- workers/cron-reminders/*
- Google Cloud / ZOOM_MEETING_URL
- Commit secrets. Don’t force-push main.

Verify: npm run build; check public /30min at desktop and ~375px; Zoom copy still correct on success screen.

Al will review the branch and merge later.
```
