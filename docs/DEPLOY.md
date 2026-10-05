# Deploy Guide

**Status: deployed and live as of 2026-08-21.** Live at **https://schedule.alabut.com** (also reachable at the underlying `https://cloudmeet-5y6.pages.dev`). This doc now doubles as a record of what was run and a reference for redeploying after future changes.

## 1. Production build

```bash
npm run build
```

Output goes to `.svelte-kit/cloudflare` (SvelteKit + `@sveltejs/adapter-cloudflare`), which is what `wrangler.toml`'s `pages_build_output_dir` points at. Passes cleanly.

## 2. Cloudflare Pages project

Project name is `cloudmeet`, created via:

```bash
npx wrangler pages project create cloudmeet --production-branch=main
```

**Note:** the project name you request isn't necessarily your `.pages.dev` subdomain — Cloudflare assigned `cloudmeet-5y6.pages.dev` here (likely a collision with an existing `cloudmeet.pages.dev` elsewhere on Cloudflare). Always check the actual output of the `create`/`deploy` command rather than assuming `<project-name>.pages.dev`.

Deployed with:

```bash
npm run build
npx wrangler pages deploy .svelte-kit/cloudflare --project-name=cloudmeet
```

This reads the D1/KV bindings straight from `wrangler.toml` — no dashboard binding step needed. Re-run this same command any time you want to ship a new version; it reuses the existing project.

Current deployment uses `.github/workflows/deploy.yml` on pushes to `main`: it builds and deploys Pages plus the cron worker, using existing Cloudflare configuration. Documentation-only commits containing `[skip ci]` skip push workflows. The automated test gate is still pending in [issue #8](https://github.com/alabut/CloudMeet/issues/8). Do not run the legacy Upstream Sync or Sync and Deploy workflows; they import upstream changes and the latter also changes production configuration.

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

Applied once already. Re-run the migrations loop any time `schema.sql` or `migrations/` changes:

```bash
npx wrangler d1 execute cloudmeet --remote --file=./schema.sql
for m in migrations/*.sql; do
  npx wrangler d1 execute cloudmeet --remote --file="$m"
done
```

Several migration files report "duplicate column" errors on a fresh apply — expected, see `SETUP-NOTES.md`; `schema.sql` already includes most of what they add.

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

The cron worker is deployed by GitHub Actions and provides health monitoring. No transactional email provider is configured, so reminder sends remain deferred in [issue #4](https://github.com/alabut/CloudMeet/issues/4). Do not enable Emailit. The following commands are historical manual deployment reference, not housekeeping instructions:

```bash
cd workers/cron-reminders
npx wrangler deploy
echo "https://schedule.alabut.com" | npx wrangler secret put APP_URL
echo "<your CRON_SECRET value>" | npx wrangler secret put CRON_SECRET
cd ../..
```

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
