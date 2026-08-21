# Tweaks Backlog
Baseline = the "working vanilla deploy" commit. Every item below is optional; roll back to baseline any time.
## Quick wins (style anchors / small edits)
- [ ] Branding pass: replace CloudMeet name/logo/colors with my own (use STYLE-MAP.md anchors)
- [ ] Fix dishonest success-screen copy: "A calendar invitation has been sent to your email address" shows even when no email service is configured — make it conditional or reword
- [ ] Google consent screen shows "Sheets MCP Server" — fix app name in Google Cloud Console → Branding (cosmetic; needs my Google account, so drive it via Claude-in-Chrome with me approving)
## Needs setup (documented, not built)
- [ ] Email notifications: Emailit API key + EMAIL_FROM, then deploy cron reminder worker (DEPLOY.md step 6)
- [ ] npm audit: 11 high transitive vulns — run `npm audit fix`, retest booking flow
## Investigations (scope before building — may not be feasible)
- [ ] Zoom instead of Google Meet for meeting links: CloudMeet has no native Zoom support; investigate Zoom API (user has Pro account) → wiring a meeting-create call into the booking flow. Scope first, decide later.
- [ ] Outlook calendar sync (documented in SETUP-NOTES.md, currently skipped)
