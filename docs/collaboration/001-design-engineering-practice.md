[mc project=design-engineering-practice thread=2026-09-08-design-engineering-practice]
===== CURSOR HANDOFF =====

## Model pick (human: set this in the Cursor model picker BEFORE sending)
Recommended: Composer 2.5
Why: The first session is mostly concrete repo scaffolding—Markdown curriculum, folder layout, templates, and links—not open-ended product judgment.

## Goal
Create a new, separate **design-engineering-practice** repository (outside CloudMeet) that holds portable design-engineering curriculum, a learning log, exercises, templates, research notes, and links to real implementations. CloudMeet is the first case study and canonical implementation reference; product-specific design systems stay in their own product repositories. Do not copy CloudMeet's live component system or application code into the new repo.

## Repo / cwd
New repository to be created at a path Al chooses (suggested: `/Users/alabut/Developer/design-engineering-practice`). Source handoff and canonical references live in CloudMeet at `/Users/alabut/Developer/CloudMeet`.

## Already true
- CloudMeet `main` is clean at `ebea8ba` and matches `origin/main`; deployed and stable.
- Local branches `design-tweaks` and `management-previews` were confirmed merged and deleted.
- CloudMeet already embodies the first case study: typed tokens in `docs/DESIGN.md`, visual catalog at `/design-system`, agentic workflow in `docs/ORCHESTRATION.md`, and the Tailwind learning curriculum in `docs/TAILWIND-AGENTIC-DESIGN-CURRICULUM.md`.
- Product design contracts (tokens, primitives, route-specific patterns) belong in each product repo. The practice repo carries portable methodology, exercises, and pointers—not a fork of CloudMeet's Svelte components or CSS.

## Done so far
- CloudMeet curriculum, learning-log entry (2026-09-07), agentic design-system goals, practitioner references, and Git branch-finish checklist are written and committed on CloudMeet `main`.
- This handoff records the intent to spin out portable material into its own repo.

## Remaining work (ordered)
1. Initialize the `design-engineering-practice` repo (git, sensible top-level folders: `curriculum/`, `learning-log/`, `exercises/`, `templates/`, `research/`, `case-studies/`).
2. Port the **human-readable** sections of CloudMeet's curriculum (short version, learning log intent, goals, references) into `curriculum/`—link to CloudMeet for the machine appendix and live implementation rather than duplicating it wholesale.
3. Add `case-studies/cloudmeet.md` summarizing CloudMeet as case study #1 with links to canonical paths (see Key paths).
4. Seed `templates/` with starter files for a learning-log entry, a small exercise brief, and a DESIGN.md skeleton (Google DESIGN.md alpha format).
5. Add a short `README.md` at repo root explaining scope: portable practice material + case-study links; implementations stay in product repos.
6. First learning-log entry in the new repo noting repo creation and CloudMeet as the inaugural case study.

## Do not do
- Do not copy CloudMeet `src/`, live components, `tailwind.config.js`, or `src/app.css` into the practice repo.
- Do not treat the practice repo as a second design-system source of truth for CloudMeet.
- Do not modify CloudMeet application code, deploy CloudMeet, or push CloudMeet from this work.
- Do not commit secrets or `.env` / `.dev.vars` contents.
- Do not ask Al to choose harness, model, or folder naming for routine scaffolding—pick sensible defaults and report decisions only when they affect scope.

## Verify
- New repo has only practice material (Markdown, templates, links)—no application runtime.
- `case-studies/cloudmeet.md` links to CloudMeet canonical docs without pasting full `docs/DESIGN.md`.
- `git status` clean after initial commit in the new repo.
- Optional: `git diff --check` if editing from a CloudMeet worktree.

## Key paths (CloudMeet — read, do not copy wholesale)
- `/Users/alabut/Developer/CloudMeet/docs/TAILWIND-AGENTIC-DESIGN-CURRICULUM.md` — portable curriculum source (human sections + reference list)
- `/Users/alabut/Developer/CloudMeet/docs/DESIGN.md` — product design contract (stays in CloudMeet)
- `/Users/alabut/Developer/CloudMeet/docs/ORCHESTRATION.md` — agentic workflow policy (link for case study)
- `/Users/alabut/Developer/CloudMeet/docs/BREAKPOINT.md` — infra/product pause context
- CloudMeet `/design-system` route — live visual catalog (reference in case study, not vendored)

## Continuity notes
- Learning-log voice and curriculum tone should match the human sections in the CloudMeet curriculum—concrete, practitioner-focused, not tutorial boilerplate.
- Agentic design goals to preserve: typed intent + tokens with rationale, foundations → semantic roles → components, closed-loop preview/lint/screenshots, version design changes like code.
- Primary references already curated in CloudMeet curriculum § Primary references (Google DESIGN.md, DTCG, Figma MCP/Code Connect, Tailwind docs, shadcn-svelte, Bits UI, Storybook, Playwright)—link out from `research/` rather than re-listing every URL in full.
- Harness recommendation for ongoing practice work in the new repo: primary orchestration agent (Codex or Claude) for judgment and briefs; Composer 2.5 for curriculum edits and template scaffolding; cheap subagents for bounded research only.

===== END HANDOFF =====

Paste into Cursor Agent → model picker = Composer 2.5 → send.
