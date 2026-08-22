# Multi-Agent Workflow

How work gets done on this project: which agent does what, how briefs are written, and what has actually gone wrong. Written 2026-08-22 after a session that used Claude Code sub-agents and Cursor together on the same codebase.

This is a record of what we learned by doing, not aspiration. Where a claim rests on evidence from this repo, that evidence is named.

## The cast

| Agent | Model | Job |
|---|---|---|
| Orchestrator | Claude Code, Opus, medium effort | The only session the human talks to. Reviews work, makes architecture calls, writes briefs, does judgment verification. Does not implement. |
| Builder (in-harness) | Claude Code sub-agent, Sonnet, medium | Multi-file code changes, CLI work, build loops. |
| Builder (external) | Cursor CLI, `composer-2.5[fast=false]` | Fast implementation. Dispatched via the `dispatch` skill. |
| Cheap worker | Claude Code sub-agent, Haiku, high effort | Read-only audits, web research, single-file edits, bounded search. |

## What each is actually good at

**Cursor Composer is very fast at implementation.** On 2026-08-22 it produced four correct, well-factored commits in about six minutes — including extracting shared logic into a helper and fixing an adjacent bug nobody asked about (the host-proposal accept path, which had the same defect plus malformed API arguments).

**Cursor is weak at verification.** In the same run it then spent roughly 48 minutes failing to verify, produced no report, and had to be killed. The cause: the brief asked it to check dashboard pages that require a real Google OAuth login it correctly refused to fake, and the brief never said what to do when blocked.

**Haiku is excellent at bounded read-only work.** The mobile audit (25 files, every form control catalogued) and the iOS-zoom research both came back accurate and fast.

**Judgment verification is where the orchestrator earns its keep.** The most serious bug of the session — a timezone off-by-one making every Monday unbookable locally — was not caught by the builder, the mobile audit, or the zoom research. It was found by noticing that two endpoints *disagreed with each other*: the month grid reported a day as bookable while the day endpoint returned zero slots. No checklist contains "compare these two endpoints." That kind of finding comes from knowing what the brief was trying to achieve.

## Verification is three layers, not one

Do not hand "verification" to a single agent. The layers want different things.

**1. Mechanical — use bash, no model at all.** Deterministic checks where an LLM adds cost and hallucination risk and nothing else:
- `npm run build` passes
- `git diff --stat package-lock.json` is empty
- `grep` for leftover auth stubs, debug returns, or forbidden theme tokens
- `ls node_modules/@rollup/` shows the arm64 binary, not x64

**2. Behavioral — use Haiku.** Needs a tool loop but not reasoning: drive the app, measure `document.documentElement.scrollWidth`, curl endpoints and compare responses, confirm computed font sizes.

**3. Judgment — keep with the orchestrator.** "Is this fix real or cosmetic? What did everyone miss? Do these two code paths agree with each other?" This is rare, so it is cheap, and it is where the real bugs surface.

The research literature on the *generator–verifier gap* supports splitting build from check: a model that wrote the code is structurally biased toward defending it, and cross-family verification catches more because different model lineages fail differently. Verification also turns out to be a low-context-transfer task — a verifier needs the brief, the diff, and the success criteria, but not the builder's reasoning.

## Rules for writing briefs

Every brief handed to any agent, in-harness or external, must carry:

1. **Definition of done** — testable, not "code is good."
2. **Hard constraints** — what must never happen. Always include: never read or reference `.dev.vars`; never run against remote/production D1; never deploy; never push.
3. **Non-goals** — agents drift. Say what not to touch. For this repo: the dashboard stays vanilla CloudMeet, no `dark:` variants, no dependency changes.
4. **Environment facts** — *this machine is arm64*. See the failure log below.
5. **Verification scope, split in two:**
   - What to attempt
   - **What NOT to attempt, and what to do instead.** Anything needing credentials, OAuth, or a human belongs here, with an explicit instruction: stop and report, do not improvise. This single paragraph would have saved 48 minutes.
6. **Commit granularity** — ask for one commit per logical unit. Cursor did this unprompted and it made review dramatically easier: intent is readable commit by commit instead of buried in a 200-line diff.

## Supervising a long-running agent

**Poll `git log`, do not wait on the completion signal.** Commits landing is an honest, cheap progress signal. In the 54-minute Cursor run, all four commits landed within the first six minutes — a `git log` check at minute seven would have revealed the work was done and the agent was spinning.

Heuristic: if the HEAD commit has not changed in ~10 minutes on a task that had been committing steadily, it is stalled, not slow.

**Killing a stalled agent destroys its report.** When the Cursor run was killed, `stdout.txt` in the run directory was empty and the write-up was lost — the commits survived but the explanation did not. Accept this tradeoff knowingly, and verify the commits directly instead. Prefer asking agents to write findings to a file as they go rather than only to stdout.

**`--timeout` on the dispatch script did not enforce.** A run dispatched with `--timeout 1800` was still alive at 54 minutes. Do not rely on it; supervise directly.

**Serial, not parallel.** Two agents in one working tree collide, and parallel runs make debugging harder. Git worktrees solve isolation but add complexity that is not worth it until individual jobs routinely exceed ten minutes. Two agents *were* run concurrently once here safely — but only because they touched provably disjoint files, and each needed a different dev-server port.

## Failure log — real incidents, do not repeat

- **Cursor installed an x64 rollup binary on an arm64 Mac, twice**, breaking the build both times. It ran a bare `npm install`, which resolved optional native deps for the wrong architecture. Recovery: `npm install @rollup/rollup-darwin-arm64 --no-save` (the `--no-save` matters — it leaves `package-lock.json` untouched). Warning the brief was not sufficient; it happened again after being told. Check for it on the way out.

- **A Sonnet sub-agent stubbed out authentication to view dashboard pages it could not log into**, inserting an unconditional `return '<userId>'` at the top of `getCurrentUser()`. It then stalled before reverting. The stub was caught in review and never committed. **Always diff `src/lib/server/auth.ts` before committing any agent's dashboard work.** The agent behaved reasonably — it needed access, refused to fake a real login, and stubbed locally — but the cleanup step is the one that gets skipped when a run dies.

- **An audit reported "no horizontal overflow found" while the user had screenshots showing overflow.** Both were right: there was no CSS overflow, the page was zoomed. iOS Safari zooms when a form control under 16px is focused and never zooms back out. Treat a confident audit result that contradicts direct observation as a signal that the *symptom is being misattributed*, not that someone is wrong.

- **Research sub-agents cite unreliable sources.** The workflow-research pass returned citations including a plausible-looking but non-existent GitHub discussion. Check citations before acting on any claim that rests on a single source.

## Local vs production

`localhost` and `schedule.alabut.com` have **entirely separate databases and KV stores**. Settings changed in one do not appear in the other. Local also has no valid Google refresh token, so calendar creation, invite emails, and Meet links cannot be tested locally at all — only on the deployed site.

Cloudflare Workers run with `TZ=UTC`; the developer machine is Pacific. This difference is not cosmetic — it masked the day-of-week bug in production while breaking every Monday locally. When local and production disagree about dates, suspect timezone handling first.

## Related

- [BUGS.md](BUGS.md) — confirmed defects and their fixes
- [TWEAKS.md](TWEAKS.md) — optional and forward-looking work
- [DEPLOY.md](DEPLOY.md) — the deploy runbook
- [SETUP-NOTES.md](SETUP-NOTES.md) — setup deviations and what has been verified live
