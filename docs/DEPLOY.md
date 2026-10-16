# Deploy Guide

**Status: deployed and live as of 2026-08-21.** Live at **https://schedule.alabut.com** (also reachable at the underlying `https://cloudmeet-5y6.pages.dev`). This doc now doubles as a record of what was run and a reference for redeploying after future changes.

## Machine-readable notes

## 1. Release checks

```bash
npm run release:check
```

This runs regressions, a build, and loopback browser behavior checks. Failed checks stop publication. Output goes to `.svelte-kit/cloudflare`. Screenshot comparisons remain separate because the current baselines were generated on macOS. Browser fixtures require no OAuth or production database.

## 2. Cloudflare Pages project

Project name is `cloudmeet`, created via:

```bash
npx wrangler pages project create cloudmeet --production-branch=main
```

**Note:** the project name you request isn't necessarily your `.pages.dev` subdomain — Cloudflare assigned `cloudmeet-5y6.pages.dev` here (likely a collision with an existing `cloudmeet.pages.dev` elsewhere on Cloudflare). Always check the actual output of the `create`/`deploy` command rather than assuming `<project-name>.pages.dev`.

For an explicitly authorized local Pages release, use the gated command:

```bash
npm run deploy -- --project-name=cloudmeet
```

This runs release checks before publishing and reads bindings from `wrangler.toml`. It deploys Pages only; the GitHub workflow also deploys the cron worker. Do not replace it with a bare Wrangler command to bypass checks.

GitHub `.github/workflows/deploy.yml` runs secret-free release checks for pull requests, pushes to `main`, and manual runs. Production requires the verification job to succeed and only publishes from `main`. Manual dispatch defaults to `verify_only: true`; an authorized release uses `verify_only: false`. A failed check marks the run failed and leaves the existing Cloudflare deployment serving. This prevents publishing unverified code; it does not automatically roll back an already-published runtime failure. The legacy upstream-sync workflows have been removed. See [issue #8](https://github.com/alabut/CloudMeet/issues/8) for evidence.

## 3. Production bindings

`wrangler.toml` has the real production IDs wired in:

```toml
[[d1_databases]]
binding = "DB"
database_name = "cloudmeet"
database_id = "e80d3848-93b0-4232-aab3-c8c1461699c9"

[[kv_namespaces]]
binding = "KV"
id = "7938d855d8824edea85202d9b5107743"
```

## 4. Schema + migrations on production D1

Applied through migration `0009` before the October 5 booking-rules release; issue #11 records the operation. No migration is needed for this closeout. Future schema changes need a reviewed migration and release plan. Do not blindly replay the schema and every migration on production.

Several migration files report "duplicate column" errors on a fresh apply — expected, see `SETUP-NOTES.md`; `schema.sql` already includes most of what they add. Migration `0009` adds `booking_date_reservations` and a partial unique active-date index. It intentionally does not backfill legacy booking rows in SQL because D1/SQLite cannot safely derive `America/Los_Angeles` dates from UTC strings; application code preserves those occupied dates.

## 5. Production secrets

All six set via `wrangler pages secret put NAME --project-name=cloudmeet`:

| Secret | Value |
|---|---|
| `ADMIN_EMAIL` | `alabut@gmail.com` |
| `APP_URL` | `https://schedule.alabut.com` (was briefly `https://cloudmeet-5y6.pages.dev` before the custom domain went live) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | From the Google Cloud OAuth client (4 redirect URIs registered: localhost, both `.pages.dev` guesses, and the real custom domain) |
| `JWT_SECRET` / `CRON_SECRET` | Random values, same as local `.dev.vars` |

Changing a secret takes effect immediately on the next request — no redeploy strictly required, though we redeployed after the `APP_URL` change anyway for a clean state.

Not configured for this deployment: Outlook host sync and transactional email. Do not enable Emailit. Future provider or credential changes require separate authorization; see [issue #4](https://github.com/alabut/CloudMeet/issues/4) and `docs/BREAKPOINT.md`.

## 6. Cron worker — deployed; reminder email sends deferred

The cron worker is deployed through the gated GitHub workflow and provides health monitoring. No transactional email provider is configured, so reminder sends remain deferred in [issue #4](https://github.com/alabut/CloudMeet/issues/4). Do not enable Emailit. Its `APP_URL` is a plain var in the worker's `wrangler.toml`; do not recreate the old secret override that previously broke health checks. The workflow maintains the separate cron and watchdog secrets.

## 7. Custom domain: schedule.alabut.com — live

Added via the Cloudflare API (`POST .../pages/projects/cloudmeet/domains`), which needed only **one** DNS record — no separate TXT validation record was required, since Cloudflare's validation method here was `http` (it validates once the CNAME resolves, using Google as the certificate authority):

- **CNAME**: `schedule.alabut.com` → `cloudmeet-5y6.pages.dev` — added to Netlify DNS (`app.netlify.com/teams/alabut/dns/alabut.com`), confirmed saved and resolving.

Domain status went to Cloudflare's `active` with SSL within about a minute of the record being saved. If you ever need to redo this (new project, domain change, etc.): add the domain in the Cloudflare dashboard or via API first — it'll tell you the exact target and whether a validation record is needed for that specific activation, since this can vary.

## Post-deploy smoke test — passed (2026-08-21)

Full walkthrough and results are in `SETUP-NOTES.md` under "Live smoke test."

**Historical note (2026-08-21):** logged into `/dashboard` with the real Google account, created a "30 Minute Meeting" event type (slug `30min`) with Mon–Fri 9–5 availability, booked a real slot as a visitor, and confirmed the booking in remote D1 and as a real event with a working **Google Meet** link on Google Calendar. That was the behavior at first deploy.

**Current behavior (since 2026-09-05):** bookings use the configured recurring **Zoom** URL (`ZOOM_MEETING_URL`) in the Google Calendar event location and description. The app does **not** request Google Meet `conferenceData`. Do not restore Meet conference creation when redeploying or debugging. See `docs/BREAKPOINT.md`.

To repeat this test after future changes:
1. Visit `https://schedule.alabut.com/dashboard`, sign in.
2. Confirm your event type(s) and availability are still there.
3. Visit `https://schedule.alabut.com/<event-slug>` in a private window and complete a test booking.
4. Confirm the booking appears in the dashboard's bookings list and on Google Calendar, with the **Zoom** join link (not Google Meet).
