# Agent orchestration policy for CloudMeet

This document is written for coding agents working on CloudMeet. Apply it silently. Al should be able to describe the desired product outcome without managing models, subagents, context, verification, or task boundaries himself.

## Objective

Operate like an automatic transmission. Keep subjective product judgment and final accountability with the primary Codex agent, route coding to Cursor Composer 2.5 by default, route knowledge work to Codex subagents, and keep verification proportional to risk. Do not ask Al to manage this routing.

## Routing work

Use these defaults when the named models and collaboration tools are available:

- **Primary Codex agent / Sol:** understand screenshots and feedback, clarify only decisions that materially change the product, write outbound briefs, supervise work, inspect diffs, integrate results, and make final visual and release judgments.
- **Cursor Composer 2.5:** default executor for coding work, including HTML/CSS/Svelte changes, multi-component implementation, refactors, tests, and bug fixes. Prefer Composer 2.5 over Cursor Auto because Al has effectively abundant Composer capacity and wants Codex usage conserved.
- **Codex Luna high subagent:** focused web research, prior-art searches, GitHub/library discovery, targeted repository reconnaissance, mechanical audits, and inexpensive independent QA.
- **Codex Terra high subagent:** deeper knowledge work requiring synthesis across many files or sources, architecture investigation, plan review, and research where Luna is not sufficient.
- **Primary Codex agent / Sol:** retain only orchestration, ambiguous product decisions, security/release judgment, final behavioral verification, and tiny edits for which dispatch overhead would exceed the implementation.

Dispatch coding automatically once the intended result is sufficiently clear. Do not ask Al which harness or model to use. A truly tiny edit may remain local only when preparing and supervising a dispatch would cost more than making and checking the edit. Keep nesting flat unless independent work is genuinely parallel.

## Context discipline

When spawning a Codex research or audit subagent:

1. Prefer no inherited turns or only the few latest relevant turns.
2. State the definition of done, exact files or surfaces, hard constraints, non-goals, and verification scope.
3. Include relevant screenshots or describe their concrete visual requirements.
4. Explicitly name approved layouts or behavior that must not change.
5. Ask the subagent not to deploy. Ask it not to commit unless the primary agent wants commits as progress signals.

Never send a week-long conversation to a subagent or Cursor when a compact brief will do.

## Design workflow

For a new batch of design feedback:

1. Inspect the current committed state and the supplied screenshots.
2. Group related requests into one coherent pass.
3. Reflect the intended visual result briefly. Do not lecture Al about implementation or orchestration.
4. If important visual intent is genuinely ambiguous, ask one focused question; otherwise make a reversible assumption and proceed.
5. Automatically dispatch the bounded implementation to Cursor Composer 2.5 in work mode. If research or repository discovery can proceed independently, send that bounded work to Luna high or Terra high first.
6. Supervise the Cursor run, inspect its commits and diff locally, and stop a stalled run instead of waiting indefinitely.
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

## Fresh tasks, subagents, automatic dispatch, and handoff

- Keep related design discussion and its implementation in one Codex task.
- Start a fresh Codex task after a major deployment, a substantial subject change, or when old research and completed phases dominate the context.
- Use Codex subagents primarily for bounded research, discovery, synthesis, audits, and independent QA—not as the default coding workforce.
- Automatically invoke the `dispatch` skill for coding work when Al's request authorizes implementation. Default to provider `cursor`, model `composer-2.5[fast=false]`, mode `work`, and `allow_work`. This project policy is standing authorization to choose the harness and model; it is not standing authorization for deployment, production mutations, real bookings, destructive actions, or scope beyond Al's request.
- Follow the dispatch skill's brief, safety, audit-trail, architecture, and supervision requirements. Prefer serial dispatch and keep final behavioral and visual judgment with the originating Codex agent.
- Use the explicit-only `handoff` skill when Al asks for a paste-ready Cursor continuation prompt. Do not launch Cursor from that skill.
- Do not ask Al to choose between local work, a subagent, Cursor, Terra, or Luna. Choose the correct mechanism and proceed within the authority of his product request.

## Dispatch brief requirements

For every automatic or explicitly requested dispatch, the outbound brief must include:

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
