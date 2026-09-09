# CloudMeet breakpoint — updated 2026-09-09

V1 is in a good place. Public booking design, dashboard functional/visual work, Zoom invites, Google OAuth in production, and Healthchecks alerting are merged on `main` and pushed. There is no required infra task left.

Live: https://schedule.alabut.com  
Repo: `/Users/alabut/Developer/CloudMeet` (`origin` = `alabut/CloudMeet`)  
This pause commit on `main` should be around `1eaf4fc` (watchdog ping) plus later docs.

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
- Health endpoint can Emailit-alert (unused — no real Emailit keys). Worker now pings optional **`HEALTHCHECK_URL`** (success vs `{url}/fail`) for a watchdog.

### Ops / accounts (no secrets in git)
- Cloudflare account `704537d8106cbc11b76cd2cfdd688acc`, Pages project `cloudmeet`, custom domain `schedule.alabut.com`.
- Workers Free is **100k requests/day**, not 1k/month. Cron ~288/day is fine.
- GitHub Actions secrets exist for deploy: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `APP_URL`, `CRON_SECRET`.
- Pages secrets include Google, JWT, Zoom, etc. **Not** `EMAILIT_*` (placeholders only in local `.dev.vars`).
- A Cloudflare API token was pasted in an earlier chat — **rotate when convenient**.

---

## Watchdog status (done 2026-09-06)

- Healthchecks check **CloudMeet cron**: Simple, period 1 day, grace 1 hour, email to `alabut@gmail.com`.
- `HEALTHCHECK_URL` is on GitHub Actions and the live `cloudmeet-cron` worker.
- Check went **Up**; Al received the test notification email.

## Since then (merged, 2026-09-06 → 2026-09-09)

- Public booking design polish and edge states are on `main`.
- Dashboard visual system, emails-page honesty (“not configured in V1”), accessibility, and Playwright visual QA are on `main`.
- Working tree is clean and matches `origin/main`.

## Recommended next

**Use it.** Share `https://schedule.alabut.com` when you want. One optional smoke booking after the redesign is enough if you want peace of mind; the Sep 7 invite already proved the Google + Zoom path.

Do not treat these as required:

1. Hide cancelled bookings on the dashboard (still listed until the date passes).
2. Resend later — only if you change your mind about branded mail. Google Calendar invitations stay the guest path. Do not enable Emailit.
3. Rename GCP project `workspace-mcp`.
4. Rotate the Cloudflare API token that appeared in an earlier chat.

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
