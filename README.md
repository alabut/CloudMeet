# CloudMeet

AL’s scheduling app is a fork of [CloudMeet](https://github.com/dennisklappe/CloudMeet). The public booking flow and host dashboard run on Cloudflare. This copy uses Google Calendar invitations with a configured recurring Zoom meeting URL. The Outlook/Teams path remains in the code but is not the configured host workflow.

The current operating decisions are in [docs/BREAKPOINT.md](docs/BREAKPOINT.md): guest notifications come from calendar invitations, and Emailit is not enabled for V1. A guest’s own calendar controls reminders. The original upstream template’s Google Meet and branded-email setup does not describe this deployment.

Track active bugs, features, and improvements in [GitHub Issues](https://github.com/alabut/CloudMeet/issues). The old Markdown lists preserve history. No Trello or GitHub Projects board is used. Production currently builds before publishing; an automated test gate is still pending in [issue #8](https://github.com/alabut/CloudMeet/issues/8).

## Machine-readable notes

- Read [AGENTS.md](AGENTS.md) and [docs/ORCHESTRATION.md](docs/ORCHESTRATION.md) before substantive work.
- [docs/BREAKPOINT.md](docs/BREAKPOINT.md) records the operating checkpoint and deployment boundaries; [docs/TWEAKS.md](docs/TWEAKS.md) records implemented and deferred product decisions.
- [docs/DESIGN.md](docs/DESIGN.md) holds the design contract; [docs/STYLE-MAP.md](docs/STYLE-MAP.md) points to public-booking implementation files.
- `npm run dev` builds and runs the local Cloudflare Pages preview. `npm run dev:watch` starts Vite for UI iteration; it is a different runtime surface. Use existing working dependencies and local configuration.
- `npm run build` builds the app; `npm run check:dashboard` and `npm run test:visual` are available checks in `package.json`. Run checks appropriate to the affected code rather than creating real bookings for verification.
- A push to `main` normally triggers `.github/workflows/deploy.yml`, deploying Pages and the cron worker. For verified documentation-only housekeeping, a commit message containing `[skip ci]` skips GitHub push workflows, allowing documentation to reach `main` without deployment. Never use this for application, test, or deployment-code changes.
- Do not provision OAuth clients, enable mail providers, refresh upstream/dependencies, or change production settings as documentation housekeeping.
- Upstream is MIT licensed; see [LICENSE](LICENSE).
