# Scheduling Bake-off: Research & Orchestration Plan

Two candidate stacks for a $0-budget, open-source scheduler on a Netlify-managed domain:

- **Stack A — Cal.diy**: Next.js + Prisma + PostgreSQL, hosted on Vercel + Supabase free tier. Repo: https://github.com/calcom/cal.diy (MIT community edition of Cal.com)
- **Stack B — CloudMeet**: Svelte + TypeScript, hosted on Cloudflare Pages + Workers + D1. Repo: https://github.com/dennisklappe/CloudMeet (MIT, single maintainer, ~500 stars)

---

## 0. Repo privacy note

A repo created in GitHub Desktop is **local-only until you click "Publish repository."** At publish time a checkbox chooses public vs. private (private is the default). Nothing to worry about until then — and since this project is meant to be open source anyway, either setting is fine.

## 1. DNS & Routing Strategy (Netlify DNS)

Use two subdomains so both stacks run side by side during the bake-off:

- `meet-a.yourdomain.com` → Vercel (Cal.diy)
- `meet-b.yourdomain.com` → Cloudflare Pages (CloudMeet)

Whichever wins later gets a clean `meet.yourdomain.com` (or the apex) with the same technique.

### Subdomain A → Vercel
1. In Vercel: Project → Settings → Domains → add `meet-a.yourdomain.com`. Vercel shows the record it wants.
2. In Netlify: Domains → yourdomain.com → DNS settings → Add record:
   - Type `CNAME`, name `meet-a`, value `cname.vercel-dns.com`, TTL default.
3. Back in Vercel, the domain check flips to valid within minutes. Vercel issues TLS automatically.

### Subdomain B → Cloudflare Pages
1. In Cloudflare: Pages project → Custom domains → add `meet-b.yourdomain.com`.
2. Because your DNS lives at Netlify (not Cloudflare), Cloudflare will ask for a **CNAME to your `<project>.pages.dev` hostname**, and possibly a TXT/CNAME validation record.
3. In Netlify DNS: Add record — Type `CNAME`, name `meet-b`, value `<project>.pages.dev`.
4. Add the validation record if Cloudflare shows one. Certificate issues automatically once validated.

### Gotchas
- **Never put these on the apex** during the bake-off — apex records can't be CNAMEs and each provider has its own workaround. Subdomains keep this trivial.
- Cloudflare's docs nudge you to move your whole zone to Cloudflare DNS. **You don't have to** — external-DNS CNAME to `*.pages.dev` is supported. You just lose Cloudflare's proxy/CDN features on the DNS layer, which Pages doesn't need anyway.
- Propagation is usually < 5 minutes on Netlify DNS; don't debug before then.

---

## 2. Infrastructure Component Breakdown

### Setup friction (for an AI agent doing local setup)

| | Stack A (Cal.diy) | Stack B (CloudMeet) |
|---|---|---|
| Repo size | Very large monorepo (yarn workspaces, dozens of packages, turborepo) | Small single app |
| Local env | Node + yarn + PostgreSQL (or remote Supabase) + long `.env` (30+ vars, NEXTAUTH secrets, cal keys) | Node + `wrangler` — D1 emulates locally via Miniflare, near-zero config |
| First run | `yarn`, prisma generate, db push/seed — 10–20 min, RAM-hungry builds | `npm i && wrangler dev` — minutes |
| Agent verdict | High friction: big context, many moving parts, env-var archaeology | Low friction: one config file (`wrangler.toml`), local-first DB |

**Winner: B by a wide margin.** Cal.diy is production-grade but agent-hostile in size; CloudMeet fits in a model's head.

### Code modifiability (you: HTML/Tailwind; agents: framework logic)

- **Cal.diy**: UI is spread across shared packages (`@calcom/ui`, features packages) with heavy abstraction. Stripping the booking page means tracing components through the monorepo. Tailwind is used, but tokens/variants are layered. Doable for an agent, tedious for a human vibe coder.
- **CloudMeet**: Svelte single-file components — markup, styles, and logic co-located per component. As an HTML/CSS person coming from Astro, Svelte files will feel *very* familiar (Astro's component format was inspired by similar ideas). You can restyle the booking flow without touching logic.

**Winner: B for you personally; A only wins if you want Cal.com's polished booking UX out of the box and never touch it.**

### Database operational overhead

- **Supabase free tier pauses projects after ~7 days of inactivity.** A paused DB means your booking page 500s until someone unpauses it. Mitigation is a GitHub Action cron that pings the DB every few days — a standard hack, but it's a standing maintenance liability and a silent failure mode (Actions in inactive repos get disabled after 60 days too, so the keep-alive itself can die).
- **Cloudflare D1 free tier never sleeps.** 5 GB storage, generous daily reads/writes, no pause behavior. Migrations run via `wrangler d1 migrations apply` locally and against prod with the same command. Zero standing maintenance.

**Winner: B.** For a low-traffic personal scheduler, "the database cannot fall asleep" is the single biggest operational difference.

### Overall read
Stack A gives you a richer, battle-tested product (team scheduling, integrations, workflows) at the cost of monorepo weight and two keep-alive hacks. Stack B gives you a small, comprehensible codebase with genuinely zero maintenance, at the cost of fewer features and single-maintainer risk (fork it — it's MIT — so upstream abandonment doesn't matter). If the bake-off criteria are DX + $0 + maintenance, expect B to win; A is worth building anyway to confirm.

---

## 3. Claude Code Workflow Validation & Reasoning-Effort Analysis

### First, honest corrections to the model roster
- **Opus 5, Sonnet 5, and Fable 5 are real current models. "Haiku 5" is not** — the latest Haiku is **Haiku 4.5** (`claude-haiku-4-5`). Everywhere the plan says Haiku 5, read Haiku 4.5.
- **Cursor is not a Claude model** — it's a separate editor/agent harness. Your dispatch skill can hand tasks to it, but its reasoning settings are configured in Cursor, not here.
- In Claude Code, effort is set via effort/thinking settings ("low / medium / high" rather than "Light/Max"), per-session or per-subagent. The mapping to your terms: Light≈low, Medium≈medium, High/Max≈high + extended thinking.

### Thesis validation: Fable-on-low as orchestrator — **valid, with one caveat**
The reasoning is sound: orchestration is mostly *routing and judgment* — which model, which task, is this output acceptable — and that draws on breadth of world knowledge and taste, not long chains of deliberation. A frontier model at low effort gives you the knowledge baseline without paying for monologues on every file edit. The caveat: keep high effort available as an *escape hatch* for the orchestrator when a genuinely gnarly integration bug appears (auth flows, Prisma migration conflicts). Locking it out entirely trades occasional multi-hour debugging loops for pennies saved.

### Task distribution

| Model | Effort | Role |
|---|---|---|
| **Fable 5** | low | Orchestration: task decomposition, model routing, acceptance review, architecture calls |
| **Opus 5** | low–medium | Deep framework parsing: navigating the Cal.diy monorepo, Prisma schema surgery, Next.js/Remix routing internals, auth wiring |
| **Sonnet 5** | low–medium | Terminal/CLI workhorse: wrangler, supabase CLI, vercel CLI, git, env setup, migrations, build loops, debugging build output |
| **Haiku 4.5** | medium–high (max fine) | Rapid small edits: single-file changes, Tailwind tweaks, config edits, quick error-message fixes, log triage |

### Why the "no High on non-Haiku models during build" constraint is correct
1. **Web-app build loops are recognition tasks, not reasoning tasks.** "The build failed because an env var is missing" is pattern-matching that Opus/Sonnet nail at low effort. High effort makes the model *generate justification*, not better answers — it re-derives conclusions it reached in the first 5% of thinking.
2. **Overthinking is an active failure mode, not just waste.** On long-thinking budgets, models second-guess correct first instincts, invent speculative edge cases, and gold-plate — refactoring code you asked it to leave alone. Low effort keeps edits surgical.
3. **Token economics compound in loops.** A build-fix cycle might run 30–50 iterations. High effort can multiply per-iteration thinking tokens 5–20×, and in an agentic loop that thinking also stuffs the context window, degrading later iterations.
4. **Haiku is the exception because its ceiling is the concern, not its cost.** Haiku at max effort is still cheaper than Sonnet at low. Scaling Haiku's effort *up* buys reliability on the cheap tier; scaling frontier models' effort *down* removes waste on the expensive tier. The two rules are the same principle from opposite ends.

---

## 4. Development Handoff Prompts

Standalone builder prompts live in:
- `docs/prompt-a-vercel-supabase.md` — Cal.diy → Supabase → Vercel
- `docs/prompt-b-cloudflare-d1.md` — CloudMeet → D1 → Cloudflare Pages

Paste each into a fresh Claude Code session when switching to build mode.
