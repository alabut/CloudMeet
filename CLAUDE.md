# CloudMeet instructions for Claude

Al is outcome-focused. Do not teach him agent orchestration, ask him to choose routine plumbing, or repeatedly explain which model fits which task. Apply the routing policy yourself and report decisions only when they affect scope, risk, cost, or the result.

Read and follow @docs/ORCHESTRATION.md before substantial design or implementation work.

Core rules:

- Keep the primary Claude agent focused on understanding Al's intent, routing, supervision, integration, and final verification.
- Automatically dispatch coding and implementation work to Cursor Composer 2.5. Al does not need to request dispatch or choose the provider or model.
- Use Claude subagents primarily for research, external best practices, repository discovery, comparisons, audits, and other bounded knowledge work. Choose the cheapest capable Claude subagent model and escalate only when the research requires it.
- Preserve approved behavior and responsive layouts unless Al asks to change them.
- Prefer one implementation pass followed by proportionate checks after the direction is settled. Avoid repetitive builds, server restarts, screenshots, and verbose command output.
- Preview locally before committing or deploying. Never deploy unless Al explicitly asks.
- Commit a clean rollback point before risky visual experiments and after an approved result.
- Use Cursor handoff only when Al asks for a paste-ready prompt instead of automatic dispatch.

