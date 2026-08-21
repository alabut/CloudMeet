# PROMPT B — CloudMeet on Cloudflare Pages + D1 (paste into a fresh Claude Code session)

**Session setup (user):** Start this session on **Sonnet 5** with effort set to **medium** (`/model`; extended thinking off).

**Working policy (you):** You are both builder and orchestrator: do the mainline work yourself, and delegate where it helps:
- **`subagent_type: haiku-fixer`** (Haiku at high effort, `.claude/agents/haiku-fixer.md`) — small bounded jobs: single-file edits, config tweaks, adding the style-anchor comments, log triage. Use it for anything parallelizable or trivially scoped.
- **`model: opus` sub-agent** — escalate to this on your own, without asking, whenever you've made a few focused attempts at one problem and are still stuck (gnarly type errors, Svelte/Workers internals). Give it the full error context and what you tried. Keep its effort at the inherited medium or below — never high or extended thinking.

Give every sub-agent a self-contained brief: exact working directory, the specific task, what "done" looks like, and an instruction to report failures verbatim.

**Autonomy policy — important:** The user is a vibe coder: strong on HTML/CSS, but serverless architecture is entirely your job, and they want as close to a one-shot run as possible. Do NOT stop to ask questions you can resolve yourself — make the standard/reversible choice, note it in SETUP-NOTES.md, and keep moving. Interrupt the user ONLY for things literally only they can do: logging into accounts, creating projects on external services, pasting back IDs/secrets, authorizing OAuth. When you do interrupt, batch everything you need into one plain-language request with exact click-by-click or copy-paste steps — assume no Cloudflare experience.

---

You are setting up **Stack B** of a scheduling-app bake-off in `~/Developer/calendar-scheduling/`. Work inside a subdirectory `stack-b-cloudmeet/`. Do not deploy anything — prepare everything so the user can click deploy themselves. Do not commit or push unless asked.

## Task 0 — Front-load ALL user interaction (do this FIRST)
The user does not want to babysit this session. Before any build work, identify **everything** in Tasks 1–4 that requires their hands — expect at minimum: Cloudflare account ready, `wrangler login`, `wrangler d1 create` + pasting back the `database_id`, any `wrangler secret put` values, and Google/Outlook OAuth credentials if they want calendar sync now. To know the full list accurately, first do a quick read-only pass: clone the repo and inspect its README and wrangler config (this is reconnaissance, not building).

Then walk the user through the entire list in ONE guided sitting: plain language, click-by-click, assume zero Cloudflare experience, collect every value/confirmation before proceeding. Where a value can't exist yet (e.g., an OAuth callback URL that depends on the final domain), use the `<project>.pages.dev` placeholder, note it in SETUP-NOTES.md, and list the post-deploy fix-up in DEPLOY.md rather than interrupting later. Ask whether they want calendar OAuth wired now or documented for later — if later, that removes it from the interactive list entirely.

**After Task 0 completes, the rest of this build must run start-to-finish with zero user interruptions.** If you discover mid-build that you missed a required user step, do everything else first, then present any leftovers as one final batched request — never dribble interruptions.

## Task 1 — Pull down CloudMeet
1. Clone https://github.com/dennisklappe/CloudMeet into `stack-b-cloudmeet/`. This is a single-maintainer MIT project (~500 stars) — before building, skim the repo for red flags (last commit date, open issues about broken deploys) and report what you find.
2. If the repo turns out to be broken or abandoned beyond quick repair, stop and tell the user; propose the closest comparable open-source Cloudflare-native scheduler you can verify, and wait for their call. Do not silently substitute.
3. Read its README and follow ITS setup instructions. Record every deviation in `stack-b-cloudmeet/SETUP-NOTES.md`.
4. Install dependencies and get `wrangler dev` (or the repo's documented dev command) running.

## Task 2 — Wrangler bindings + D1 (local and production)
1. Inspect `wrangler.toml` (or `wrangler.jsonc`) and enumerate every binding the app expects: D1 database, KV/Durable Objects if any, secrets, env vars.
2. **Local D1:** create the local database and apply the repo's migrations/schema (`wrangler d1 migrations apply <name> --local` or its documented equivalent). Verify tables with `wrangler d1 execute --local --command "SELECT name FROM sqlite_master"`.
3. **Production D1:** creating it requires the user's Cloudflare account. Print the exact commands for them to run (`wrangler login`, `wrangler d1 create <name>`), wait for them to paste back the resulting `database_id`, then wire it into the config. Same pattern for any secrets (`wrangler secret put`) — user runs, you specify names and where values come from.
4. Google/Outlook calendar OAuth credentials are the user's to create; document the exact console steps and callback URLs in SETUP-NOTES.md rather than fabricating placeholders that look real.
5. Run the full local booking flow end-to-end against local D1 and confirm it works before declaring done.

## Task 3 — Prepare for Cloudflare Pages
1. Do not deploy. Write `stack-b-cloudmeet/DEPLOY.md` with: Pages project settings (build command, output directory, framework preset — verify against the repo), production bindings to attach (D1, secrets), the migrations-against-prod command, and the DNS step for Netlify-managed DNS (custom domain `meet-b.yourdomain.com` → CNAME to `<project>.pages.dev`, plus any validation record Cloudflare shows, since the zone is NOT on Cloudflare DNS).
2. Confirm the production build passes locally.

## Task 4 — Visual anchors for the user's HTML/CSS pass
The user (deep HTML/CSS/Astro experience — Svelte files will feel familiar) will restyle the booking UI by hand:
1. Locate the global stylesheet / design tokens and the main layout + booking-flow Svelte components.
2. Add clearly-marked anchor comments — `/* ===== USER STYLE ANCHOR: <name> ===== */` in CSS and `<!-- ===== USER STYLE ANCHOR: <name> ===== -->` in Svelte markup — at: global CSS entry, theme/token block, booking page layout wrapper, availability/slot picker, booking form, and confirmation view.
3. List every anchor with its file path in `stack-b-cloudmeet/STYLE-MAP.md` with one line on what each controls. Do not restyle anything yourself.

## Definition of done
Local dev serves the full booking flow against local D1; production build passes; DEPLOY.md and STYLE-MAP.md are complete; production-side steps that need the user's account are documented as exact commands, not guessed values. Report anything unverified honestly in SETUP-NOTES.md.
