# Agent orchestration policy for CloudMeet

This document is written for coding agents working on CloudMeet. Apply it silently. Al should be able to describe the desired product outcome without managing models, subagents, context, verification, or task boundaries himself.

## Objective

Deliver careful visual and functional changes with minimal token waste. Keep subjective product judgment close to the primary conversation; move bounded execution to the least expensive capable agent; keep verification proportional to risk.

## Routing work

Use these defaults when the named models and collaboration tools are available:

- **Primary agent / Sol:** understand screenshots and feedback, clarify only decisions that materially change the result, settle the design direction, integrate work, and make final visual judgments.
- **Luna on high:** bounded HTML, CSS, Tailwind, and Svelte presentation edits; targeted file inspection; mechanical cleanup; focused responsive QA.
- **Terra on high:** changes spanning several components, state or application logic, API/UI coordination, and implementation that requires more codebase reasoning.
- **Primary agent / Sol:** retain work with meaningful architectural uncertainty, conflicting requirements, security or deployment risk, or unusually subjective design judgment.

Do not delegate every tiny edit. Delegate a coherent implementation unit after the intended result is clear. Keep nesting flat unless independent work is genuinely parallel.

## Context discipline

When spawning a subagent:

1. Prefer no inherited turns or only the few latest relevant turns.
2. State the definition of done, exact files or surfaces, hard constraints, non-goals, and verification scope.
3. Include relevant screenshots or describe their concrete visual requirements.
4. Explicitly name approved layouts or behavior that must not change.
5. Ask the subagent not to deploy. Ask it not to commit unless the primary agent wants commits as progress signals.

Never send a week-long conversation to a subagent when a compact brief will do.

## Design workflow

For a new batch of design feedback:

1. Inspect the current committed state and the supplied screenshots.
2. Group related requests into one coherent pass.
3. Reflect the intended visual result briefly. Do not lecture Al about implementation or orchestration.
4. If important visual intent is genuinely ambiguous, ask one focused question; otherwise make a reversible assumption and proceed.
5. Delegate the bounded implementation to Luna high, or Terra high when it spans application behavior or multiple coordinated components.
6. Review the diff locally before running expensive checks.
7. Run one browser pass covering the affected desktop state, the affected mobile state, and any important interaction state.
8. Revise only against a concrete mismatch. Do not broaden the design or add unrelated polish.
9. When approved, commit the result. Deploy only on explicit request.

For small, reversible CSS changes, `git diff --check` plus targeted browser verification is normally sufficient during iteration. Run the production build after the batch stabilizes, before commit or deployment, rather than after every adjustment.

## Verification economy

- Keep a local server running during an iteration instead of restarting it after every edit when the toolchain can reload changes.
- Filter or truncate known noisy build output; report the exit result and only new, relevant warnings.
- Do not repeat a passing check unless the code affecting it changed or a visual observation contradicts it.
- Use screenshots only when visual comparison matters. Use DOM/accessibility inspection for text, state, and available controls.
- Test the smallest set of responsive widths and interaction states that can expose the requested regression.
- Never create, cancel, or reschedule real meetings merely to verify UI work. Use mocked or read-only verification unless Al explicitly authorizes a real transaction.

## Fresh tasks, subagents, dispatch, and handoff

- Keep related design discussion and its implementation in one Codex task.
- Start a fresh Codex task after a major deployment, a substantial subject change, or when old research and completed phases dominate the context.
- Use a subagent for a bounded part of the current task.
- Use the explicit-only `dispatch` skill when Al asks to send a bounded task to Codex, Claude Code, or Cursor. Follow the skill's provider, mode, brief, safety, and supervision requirements. Prefer serial dispatch and keep final behavioral and visual judgment with the originating agent.
- Use the explicit-only `handoff` skill when Al asks for a paste-ready Cursor continuation prompt. Do not launch Cursor from that skill.
- Do not tell Al to memorize these distinctions. Choose the correct mechanism and proceed when authorized.

## Dispatch brief requirements

When dispatch is explicitly requested, every outbound brief must include:

- Testable definition of done.
- Hard constraints and secrets policy.
- Non-goals and files or features that must remain unchanged.
- Repository path, environment facts, and architecture caveats.
- Checks the dispatched agent should attempt.
- Checks it must not attempt, especially anything requiring credentials, OAuth, production data, or real bookings.
- Commit expectations and a prohibition on deployment or pushing unless explicitly authorized.

Dispatch implementation outward; keep mechanical checks local where possible; keep product judgment with the primary agent.

## Repository safety and checkpoints

- Begin by checking `git status` and the latest commit.
- Preserve unrelated user changes.
- Before a risky experiment, ensure there is a known clean commit to return to.
- Use one commit per approved logical unit with a plain description.
- Never deploy from a dirty or failing tree.
- After deployment, verify the custom domain rather than relying only on the provider's success message.

## Communication contract

Lead with the outcome. Keep progress updates short. Mention model or routing choices only when useful for trust or when Al asked. Do not turn implementation reports into tutorials about agent systems. Surface broken behavior plainly and distinguish verified facts from inference.

