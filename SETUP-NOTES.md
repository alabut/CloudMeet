# Setup Notes

## Repo structure (2026-08-21 restructure)

The project was originally built inside `~/Developer/calendar-scheduling/stack-b-cloudmeet/`, a subdirectory of a "bake-off" parent repo comparing multiple scheduling-app stacks (see `docs/bakeoff-research.md` and `docs/prompt-a-vercel-supabase.md`, the unbuilt alternative stack, both carried over below for reference). That structure was collapsed into a single project:

- **Forked** `dennisklappe/CloudMeet` to `alabut/CloudMeet` on GitHub — **public** (deliberately, not private: it's a personal-site customization with no secrets in the repo, and staying in GitHub's fork network gives a "forked from dennisklappe/CloudMeet" badge for free — useful as a portfolio/conversation-starter piece).
- Moved `docs/` and `.claude/` (agent definitions used to build this) from the old parent repo into this repo and committed them ("Absorb project docs and agent definitions").
- Git remotes: `origin` = `https://github.com/alabut/CloudMeet.git` (your fork, push target), `upstream` = `https://github.com/dennisklappe/CloudMeet.git` (read-only, for pulling upstream fixes).
- Relocated the whole folder from `~/Developer/calendar-scheduling/stack-b-cloudmeet/` to **`~/Developer/CloudMeet/`** as a standalone top-level project — the "stack-b" name no longer applied once it was the only stack. Verified nothing referenced the old path (grep across config/code came up clean — only the historical planning docs themselves mention it, which is fine as a record) and that build + local D1 state survived the move intact.
- The old parent repo (`~/Developer/calendar-scheduling/`, a single unpublished local "Initial commit" with no remote) was deleted once confirmed empty.
- Pushed to the fork's `main`. Nothing was pushed to `upstream` (you don't have write access there, and shouldn't — see the PR rule below).

**Sync fork routine** (pulling upstream fixes into your fork):

```bash
git fetch upstream
git log main..upstream/main --oneline   # see what's new upstream
git merge upstream/main                 # or: git rebase upstream/main
git push origin main
```

This works via plain git remotes regardless of GitHub's fork-network UI status — no dependency on GitHub's own "Sync fork" button.

**Rule: contributing back upstream.** If you ever want to send a fix or feature back to `dennisklappe/CloudMeet`, open the PR from a **clean branch cut off `upstream/main`** (`git fetch upstream && git checkout -b fix/whatever upstream/main`), not off your customized `main` — your `main` carries personal branding, config, and style changes that don't belong in a PR meant for the original project. Cherry-pick just the relevant commit(s) onto that clean branch instead.

**Housekeeping while restructuring:** `static/availability/defaults.json` and `static/cache-warming.json` were untracked from git (added to `.gitignore`) — `scripts/prebuild.js` rewrites a fresh timestamp into both on every single `npm run build` (an `npm` `prebuild` hook), so they showed a no-op diff after every build, forever. This is a pre-existing upstream behavior, not something introduced here. Files still exist on disk and still ship in the build output — only the git tracking changed.

**Upstream Issue #8 check** (build failure from a duplicate `cacheKey` variable declaration in the availability endpoints, per your request): confirmed our current code has only one `const cacheKey` declaration in each of `src/routes/api/availability/+server.ts` and `.../month/+server.ts` — the bug described in the issue isn't present, consistent with our clean build (both locally and the successful production deploy). The issue is still shown "Open" upstream, but that appears to be bookkeeping lag on the maintainer's side rather than an unfixed bug on `main` — the buggy commit referenced in the issue (`29367ab`) either never landed on `main` or was corrected before/without a linked closing commit. Practical takeaway: we're unaffected regardless of the issue's open/closed status, and `git fetch upstream` will surface it either way if that ever changes.

## Repo health check (Task 1)

- Cloned from https://github.com/dennisklappe/CloudMeet on 2026-08-20.
- Last commit: 2026-07-02 (~7 weeks before this setup) — actively maintained, not abandoned. History shows regular dependency bumps (dependabot) and real bug fixes merged in, including a null-handling regex fix from July 2026.
- Single maintainer, MIT license, ~500 stars per the task brief. No red flags found in the commit history or repo structure. Did not check GitHub Issues directly (no network browsing tool used for that) — worth a quick look before a real production launch, but nothing in the code or CI config suggested a broken/abandoned project.
- **Decision:** proceeded with CloudMeet as-is; no substitution needed.

## Deviations from the README

1. **Deploy path.** The README's documented flow is: use this repo as a GitHub template → add repo secrets → trigger `.github/workflows/deploy.yml` via GitHub Actions. This task's instructions call for direct `wrangler`/Pages CLI setup instead, so that's what we did — see `DEPLOY.md`. The GitHub Actions path still works if you'd rather use it later (fork as template, add the same secret values documented here), but the two shouldn't be run against the same Cloudflare Pages project without reconciling `wrangler.toml` by hand — the Actions workflow patches `wrangler.toml` on every run.
2. **`.gitignore` gap.** The repo's `.gitignore` excludes `.env*` but not `.dev.vars` (the file Wrangler actually reads for local secrets, per the README's own "Local Development" instructions). Added `.dev.vars` and `.dev.vars.*` to `.gitignore` before creating the file, so real secrets (Google OAuth client secret, JWT secret) never risk being committed.
3. **D1 database name.** The repo's own CI (`deploy.yml`) creates the production database as `cloudmeet-db`, while `wrangler.toml` and the local `db:init` script both use `cloudmeet`. We used `cloudmeet` everywhere (matching `wrangler.toml` and local dev) rather than the CI's `cloudmeet-db`, since we're not using that CI path. Functionally this doesn't matter — Cloudflare resolves D1 bindings by ID, not name — but it's worth knowing if you ever do turn on the GitHub Actions flow, since it will create a *second*, separate `cloudmeet-db` database rather than reusing this one.
4. **Migrations applied by direct SQL execution, not `wrangler d1 migrations apply`.** This repo doesn't use Cloudflare's D1 migrations tooling — it has its own `schema.sql` (base) plus a flat `migrations/*.sql` folder applied via `wrangler d1 execute --file=`, mirroring exactly what `deploy.yml` does. Several migration files (0002, 0004, 0005, 0006, 0007, 0008) throw "duplicate column/index already exists" errors when applied locally, because `schema.sql` already includes what they add — this is expected and matches the repo's own CI, which ignores these errors with `|| true`. Only `0003_add_email_templates.sql` added genuinely new schema.

## Assumptions made without asking (per the autonomy policy)

- **Cloudflare Pages project name:** `cloudmeet` (matches the repo's own defaults for D1/KV binding names — least surprising choice). Fallback URL is `cloudmeet.pages.dev`; real production URL will be `schedule.alabut.com` per your instruction (Netlify-managed DNS — see `DEPLOY.md` step 7).
- **Admin login email:** `alabut@gmail.com` — asked for confirmation in chat, no correction was given, proceeded on that basis.
- **Outlook Calendar sync:** skipped/documented-only per your answer. To add it later: follow the "Setup Microsoft OAuth" section of the original `README.md` (Azure App Registration), then `npx wrangler pages secret put MICROSOFT_CLIENT_ID --project-name=cloudmeet` and the same for `MICROSOFT_CLIENT_SECRET`. No code changes needed — the app already checks for these at runtime and only shows Outlook options when they're present.
- **Emailit (transactional email):** skipped per your answer. To add later: create an account at emailit.com, get an API key, then `npx wrangler pages secret put EMAILIT_API_KEY --project-name=cloudmeet` and set `EMAIL_FROM`. Booking confirmations, cancellations, and reminders will start sending automatically once that key is present — no code changes needed.
- **JWT_SECRET / CRON_SECRET:** generated locally via Python's `secrets.token_hex(32)` (equivalent to the README's suggested `openssl rand -hex 32`) rather than asking you to generate/paste these — they're not something only you can produce, so no reason to interrupt for them. Live in local `.dev.vars` (gitignored); same values documented in `DEPLOY.md` step 5 for production, or regenerate fresh ones there if you prefer.

## Local verification performed (Task 2)

- `npm install` — clean, 253 packages. `npm audit` reports 15 vulnerabilities (1 low, 3 moderate, 11 high) in transitive dependencies — not investigated further since this is a setup/prep task, not a security audit; worth running `npm audit fix` and re-testing before a real production launch.
- `npm run build` (production build via Vite + `@sveltejs/adapter-cloudflare`) — passes cleanly.
- Local D1 (`cloudmeet`) created, `schema.sql` + all migrations applied, 13 tables confirmed present via `sqlite_master` query.
- `wrangler pages dev` runs cleanly against local D1/KV. One benign warning on startup: `node:async_hooks` isn't polyfilled without the `nodejs_compat` compatibility flag — this is a warning, not an error; the app ran correctly in testing without needing that flag added. Flag it if you see actual runtime errors mentioning `async_hooks` after a real deploy; the fix would be adding `compatibility_flags = ["nodejs_compat"]` to `wrangler.toml`.
- **Full visitor booking flow tested end-to-end against local D1**, via the built-in browser tool:
  1. Seeded a test host user (`alabut@gmail.com`, slug `al`), one event type (`30 Minute Meeting`, slug `30min`, 30 min), and weekly 9am–5pm availability rules directly into local D1 (SQL insert) — this bypasses the admin login/dashboard UI, which requires a real Google OAuth login that only you can complete (see below).
  2. Visited `http://localhost:8788/30min`, selected an available date and time slot, filled in the booking form, and submitted.
  3. Got the "You are scheduled" confirmation screen; verified the booking row landed correctly in the local `bookings` table.
  4. This confirms: routing, D1 reads/writes, availability-slot generation (including timezone conversion), KV caching, and the booking API all work correctly. Google Calendar event creation was **not** exercised in this test (no real refresh token locally) — the code gracefully skips calendar-event creation on API errors and still books the slot, so this doesn't block the visitor flow, but it means the "adds to Google Calendar" feature itself is unverified until you log in for real.
  5. **Not tested:** the admin dashboard / login flow itself. Completing a real Google OAuth login requires your actual Google password, which I never enter (see the security conversation earlier in this session). I did confirm the OAuth redirect wiring is correct — clicking "Login with Google" in the browser correctly reached Google's real sign-in page with the right client ID and redirect URI. **You should log in once yourself** (locally at `http://localhost:8788` or after deploying) to verify the dashboard, event-type creation, and Google Calendar connection end-to-end.
  6. One cosmetic-only oddity spotted on Google's consent screen during that check: it displayed "to continue to **Sheets MCP Server**" instead of "CloudMeet" — likely because the Google Cloud project used for the OAuth client wasn't a fresh one, or the OAuth consent screen's app name field wasn't set to "CloudMeet" when it was created. Doesn't affect functionality, but you may want to fix the consent screen's app name in Google Cloud Console (**APIs & Services → OAuth consent screen → Branding**) before sharing the booking link publicly, since visitors don't see this screen but *you* will on every login.
  - The local seed data (test user + event type + a completed test booking) is still sitting in local D1 — harmless, but delete it before your own testing if you'd rather start clean: `rm -rf .wrangler/state` and re-run `npm run db:init` + the migrations loop in `DEPLOY.md` step 4 (with `--local` instead of `--remote`).

## Production resources already created (Task 2)

- Cloudflare account confirmed via `wrangler login` (OAuth, browser-based — you approved it).
- D1 database `cloudmeet` created (ID wired into `wrangler.toml`). **Empty** — schema/migrations not yet applied to it; command to do so is in `DEPLOY.md` step 4. Deliberately not run yet, since the task said not to deploy anything and applying schema to an otherwise-unused remote database seemed reasonable to bundle with the actual deploy step rather than run in isolation now.
- KV namespace `cloudmeet-kv` created (ID wired into `wrangler.toml`).
- Google OAuth client created by you in Google Cloud Console, with all three redirect URIs registered up front (localhost, `.pages.dev`, and the real `schedule.alabut.com` domain) so no return trip to Google Console should be needed post-deploy.

## Verified live by the user (2026-08-21 update)

You logged into the admin dashboard locally yourself and confirmed: Google OAuth login works end-to-end, the dashboard loads, your real Google account merged cleanly with the seeded test user (same email), and Google Calendar sync is genuinely functional — a third test booking created a real event on your Google Calendar and sent you an email alert. This verifies everything previously listed as "not tested" above (routing, D1, availability generation, the booking API, Google Calendar event creation, and the full login/dashboard flow) — all confirmed working locally.

**Admin login location:** the dashboard is at `/dashboard` — there is intentionally no link to it from the public visitor homepage (single-user app; the host is expected to bookmark or navigate there directly). Earlier drafts of this doc implied a homepage login link, which was a documentation gap, not a functional one — fixed here and in `DEPLOY.md`.

## Production deploy (2026-08-21)

- **Cloudflare Pages project name is `cloudmeet`, but the assigned `.pages.dev` subdomain is `cloudmeet-5y6.pages.dev`**, not `cloudmeet.pages.dev` as assumed during setup planning (likely a name collision with an existing project elsewhere on Cloudflare). This mattered for two things, both fixed:
  - Added `https://cloudmeet-5y6.pages.dev/auth/callback` as a fourth Google OAuth redirect URI (in addition to the three registered earlier) so login works on the raw Pages URL, not just the custom domain.
  - `APP_URL` was set to the real `cloudmeet-5y6.pages.dev` initially, then updated to `https://schedule.alabut.com` once the custom domain went live (see below), followed by a redeploy.
- Remote D1 (`cloudmeet`) had `schema.sql` + all migrations applied — same expected "duplicate column" errors as local, all benign.
- All six production secrets set via `wrangler pages secret put`.
- Deployed via `wrangler pages deploy` — live at `https://cloudmeet-5y6.pages.dev` and `https://schedule.alabut.com`.
- **Custom domain:** `schedule.alabut.com` added to the Pages project via the Cloudflare API. Only one DNS record was actually required — a CNAME (`schedule` → `cloudmeet-5y6.pages.dev`) added to Netlify DNS by you; validation happened automatically via HTTP once the CNAME resolved (no separate TXT record needed, despite `DEPLOY.md` step 7 flagging that as a possibility). Domain went to Cloudflare status "active" with SSL within about a minute of the CNAME being saved.
- **Google OAuth consent screen context:** the OAuth client lives in a pre-existing Google Cloud project called `workspace-mcp`, shared with an unrelated "Claude custom connectors" OAuth client — this is why the consent screen showed "Sheets MCP Server" during local testing (that's the workspace-mcp project's registered branding) and now shows "alabut.com" (Google falls back to the verified domain name once a domain-verified redirect URI, `schedule.alabut.com`, is registered — confirmed via the `google-site-verification` TXT record already present in your Netlify DNS zone). Fully cosmetic; tracked in `TWEAKS.md` if you want a dedicated project instead.
- **Event type slug hiccup during the live smoke test:** the dashboard's "URL Slug" field auto-fills from the Event Name as you type, and it doesn't clear when you then click into the slug field and type your own value — it appends instead. First attempt produced slug `30-minute-meeting30min` instead of `30min`. Not a deploy issue; caught and corrected immediately by editing the event type. Worth knowing if you create more event types by hand: clear the slug field (select-all, then type) rather than assuming it's empty.

## Live smoke test — verified end-to-end on production (2026-08-21)

1. Logged into `https://schedule.alabut.com/dashboard` with your real Google account (you handled the OAuth consent click).
2. Created event type "30 Minute Meeting" (slug `30min`), set Mon–Fri 9am–5pm availability.
3. Booked a real slot as a visitor at `https://schedule.alabut.com/30min` — Monday, Aug 24 2026, 2:00–2:30 AM Pacific, attendee `alabut+smoketest@gmail.com` — you approved the final submit.
4. **Confirmed booking row in remote D1**: correct attendee, correct UTC times (`09:00:00Z`–`09:30:00Z`, matching 2:00 AM PDT), `status: confirmed`.
5. **Confirmed real Google Calendar event**: "30 Minute Meeting with Smoke Test", Aug 24 2026, 2am–2:30am, visible on your actual calendar via `calendar.google.com`, with a working Google Meet link (`meet.google.com/zcf-hkky-xsh`).
6. Confirmation screen correctly showed a "Join Google Meet" link (this only appears when calendar event creation genuinely succeeded).

This confirms production D1, production KV, production secrets, the Google OAuth flow, calendar event creation, and the full visitor booking flow are all working correctly on the real deployed app.

## Still unverified / left for you

- Google OAuth consent screen branding — cosmetic, your call whether to move the OAuth client to a dedicated Google Cloud project. Tracked in `TWEAKS.md`.
- `npm audit` vulnerabilities — not triaged. Tracked in `TWEAKS.md`.
- Email notifications (Emailit) and the cron reminder worker — not set up, by your choice; documented in `DEPLOY.md` step 6 and `TWEAKS.md`.
- Outlook calendar sync — not set up, by your choice; documented above and in `TWEAKS.md`.
