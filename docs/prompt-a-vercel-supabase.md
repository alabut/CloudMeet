# PROMPT A — Cal.diy on Vercel + Supabase (paste into a fresh Claude Code session)

**Session setup (user):** Start this session on **Sonnet 5** with effort set to **medium** (`/model`; extended thinking off). (Save Fable budget for scoping and post-build review, not build loops.)

**Working policy (you):** You are both builder and orchestrator: do mainline work yourself and delegate where it helps. Default routing — stay flexible per task:
- **`subagent_type: sonnet-builder`** — the workhorse (Sonnet at medium effort, `.claude/agents/sonnet-builder.md`): CLI, env setup, build loops, migrations, debugging build output.
- **`model: opus`** — the heavy lifting specific to this stack: Cal.diy monorepo navigation, Prisma schema work, Next.js auth wiring. Opus inherits the session's low effort, which is intended — its knowledge is the point, not long deliberation.
- **`subagent_type: haiku-fixer`** — single-file edits, config tweaks, style-anchor comments, quick fixes (Haiku at high effort, `.claude/agents/haiku-fixer.md`). Use it instead of a plain `model: haiku` call.

Give every sub-agent a self-contained brief (working directory, task, definition of done, report failures verbatim). Escalate to Opus on your own judgment — do not stop to ask permission. Never run Sonnet or Opus at high effort or extended thinking during this build; Haiku is exempt.

**Autonomy policy — important:** The user is a vibe coder: strong on HTML/CSS, but backend architecture is entirely your job, and they want as close to a one-shot run as possible. Do NOT stop for questions you can resolve yourself — make the standard/reversible choice, note it in SETUP-NOTES.md, keep moving. Interrupt ONLY for things literally only they can do (account logins, creating the Supabase project, pasting connection strings/secrets, OAuth authorization), and batch those into one plain-language request with exact click-by-click steps.

---

You are setting up **Stack A** of a scheduling-app bake-off in `~/Developer/calendar-scheduling/`. Work inside a subdirectory `stack-a-caldiy/`. Do not deploy anything — prepare everything so the user can click deploy themselves. Do not commit or push unless asked.

## Task 0 — Front-load ALL user interaction (do this FIRST)
The user does not want to babysit this session. Before any build work, do a quick read-only reconnaissance (clone the repo, read README and `.env.example`) to enumerate everything in Tasks 1–4 that requires the user's hands — expect at minimum: creating the Supabase project and pasting back both connection strings, GitHub repo secrets for the keep-alive workflow, and any optional integration credentials they want now. Then walk them through the entire list in ONE guided sitting: plain language, click-by-click, collect every value before proceeding. Values that can't exist yet get placeholders noted in SETUP-NOTES.md and a post-deploy fix-up entry in DEPLOY.md.

**After Task 0, the rest of the build must run start-to-finish with zero user interruptions.** If you discover a missed user step mid-build, finish everything else and present leftovers as one final batched request — never dribble interruptions.

## Task 1 — Pull down Cal.diy
1. Clone https://github.com/calcom/cal.diy into `stack-a-caldiy/` (shallow clone, `--depth 1`, to keep it light).
2. Read its README and `.env.example` first. Follow ITS documented setup, not generic Cal.com lore — the community edition's instructions may differ.
3. Install dependencies with the package manager the repo specifies (expect yarn workspaces). Record every deviation you make from the README in `stack-a-caldiy/SETUP-NOTES.md`.

## Task 2 — Hook up Supabase (free tier)
1. The user must create the Supabase project themselves (account/credentials are theirs). Print the exact steps: create project → Settings → Database → copy the **pooled** connection string (port 6543, pgbouncer) AND the **direct** connection string (port 5432).
2. Wait for the user to paste both strings, then write `.env` accordingly: Prisma typically wants the pooled URL for `DATABASE_URL` and the direct URL for `DIRECT_URL` / migrations — confirm against Cal.diy's Prisma schema datasource block.
3. Generate the remaining required secrets yourself (`NEXTAUTH_SECRET`, `CALENDSO_ENCRYPTION_KEY`, etc. — `openssl rand -base64 32`). Fill every var `.env.example` marks required; note optional integrations you skipped in SETUP-NOTES.md.
4. Run Prisma migrations/db push and the seed against Supabase. Verify with a quick Prisma query or `psql` that tables exist.
5. Run the dev server and verify the booking page renders locally. Fix build errors iteratively (Sonnet, low effort; escalate parsing of deep monorepo errors to Opus).

## Task 3 — Supabase keep-alive GitHub Action
Supabase free tier pauses after ~7 days of inactivity. Create `.github/workflows/supabase-keepalive.yml`:
- Cron: every 3 days (well inside the window).
- Job: a trivial read query against the database (e.g. `SELECT 1` via `psql` with a `SUPABASE_DB_URL` repo secret, or a Supabase REST ping with anon key). Keep it read-only.
- Also add a no-op step comment reminding that GitHub disables cron in repos with 60 days of no activity — the workflow should also be triggerable via `workflow_dispatch`.
- Tell the user which repo secrets to add and where.

## Task 4 — Prepare for Vercel
1. Do not run `vercel deploy`. Instead write `stack-a-caldiy/DEPLOY.md` with: exact Vercel project settings (framework preset, root directory, build command, install command — verify against the monorepo layout), the full env var list to paste into Vercel with which values come from where, and the Netlify DNS CNAME step (`meet-a` → `cname.vercel-dns.com`).
2. Confirm the production build passes locally (`yarn build` or repo equivalent) before declaring done.

## Task 5 — Visual anchors for the user's HTML/CSS pass
The user (deep HTML/Tailwind experience) will restyle the booking UI by hand. Make that easy:
1. Locate the global stylesheet / Tailwind config and the top-level layout + booking-page components.
2. Add clearly-marked anchor comments — `/* ===== USER STYLE ANCHOR: <name> ===== */` in CSS and `{/* ===== USER STYLE ANCHOR: <name> ===== */}` in JSX — at: global CSS entry, theme/token definitions, booking page layout wrapper, event-type card, calendar/slot picker, and confirmation screen.
3. List every anchor with its file path in `stack-a-caldiy/STYLE-MAP.md`, with one line on what each controls. Do not restyle anything yourself.

## Definition of done
Local dev server serves a working booking flow against Supabase; production build passes; keep-alive workflow exists; DEPLOY.md and STYLE-MAP.md are complete and accurate. Report anything you couldn't verify honestly in SETUP-NOTES.md.
