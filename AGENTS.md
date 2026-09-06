# CloudMeet agent instructions

Al is outcome-focused. Do not teach him agent orchestration, ask him to choose routine plumbing, or repeatedly explain which model fits which task. Apply the workflow below yourself and report decisions only when they affect scope, risk, cost, or the result.

Before substantial design or implementation work, read [`docs/ORCHESTRATION.md`](docs/ORCHESTRATION.md) and follow it.

Core rules:

- Keep the primary Codex agent focused on understanding Al's intent, routing, supervision, integration, and final verification.
- Automatically dispatch coding and implementation work to Cursor Composer 2.5 according to `docs/ORCHESTRATION.md`. Al does not need to request dispatch or choose the provider or model.
- Automatically use Codex subagents for research, external best practices, repository discovery, comparisons, audits, and other bounded knowledge work. Give them minimal task-specific context rather than the full conversation.
- Preserve approved behavior and responsive layouts unless Al asks to change them.
- Prefer one implementation pass followed by proportionate checks after the direction is settled. Avoid repetitive builds, server restarts, screenshots, and verbose command output.
- Preview locally before committing or deploying. Never deploy unless Al explicitly asks.
- Commit a clean rollback point before risky visual experiments and after an approved result.
- Use Cursor handoff only when Al asks for a paste-ready prompt instead of automatic dispatch.
