# CloudMeet public design system

This is the implementation contract for CloudMeet's visitor-facing interface. It is written primarily for agents and maintainers. The local `/design-system` route is the human-facing visual catalog.

## Scope and authority

- Applies to public booking, confirmation, cancellation, rescheduling, reschedule-response, privacy, and public error states.
- The authenticated dashboard is a sibling product surface with its own token layer (`.dashboard-flow`, `--dash-*`) and primitives under `src/lib/components/dashboard/primitives/`. See the dashboard section below and `/design-system/dashboard`.
- `docs/BREAKPOINT.md` remains authoritative for product and infrastructure boundaries.
- Preserve working booking behavior, Zoom wording, Google Calendar invitation behavior, and separate mobile/desktop booking markup unless a task explicitly changes them.
- Before adding page-local styles, inspect the visual catalog and existing primitives. Reuse or extend the smallest appropriate component.

## Product character

CloudMeet should feel like a focused extension of alabut.com rather than a stock scheduling product:

- Warm, editorial, and personal rather than corporate SaaS.
- Dark-first with a cream light mode.
- Orange accent for focus, selection, success, and navigational emphasis—not indiscriminate decoration.
- Serif body and detail copy; restrained sans-serif display headings; monospaced metadata.
- Generous vertical rhythm and deliberate centering where the task is singular.
- Quiet borders and surfaces. Avoid stacks of gray boxes.

## Foundations

The current implementation uses Tailwind 3.4. Semantic CSS variables live in `src/app.css` and are mapped into Tailwind in `tailwind.config.js`.

### Color roles

- `bg`: page canvas.
- `field-bg`: solid inner surface for details and controls.
- `surface` / `bg-secondary`: subtle secondary surface; do not stack repeatedly.
- `text`: primary content.
- `text-secondary`: supporting copy and metadata.
- `border`: quiet structure.
- `accent`: active, selected, successful, and navigational emphasis.
- `accent-hover`: interactive hover emphasis.
- Destructive red is reserved for destructive actions, irreversible warnings, and actual errors. Historical or currently selected information is neutral.

### Typography

- `font-display`: headings and primary UI labels.
- `font-serif`: body, explanatory, and event-detail copy.
- `font-meta`: dates, durations, labels, and compact metadata; typically uppercase with tracking.
- Maintain the 16px minimum for form controls to avoid iOS input zoom.

### Shape and spacing

- `rounded-large` is the major shell radius.
- `rounded-lg` or `rounded-small` is appropriate for nested details and controls.
- `p-gutter` is standard viewport edge protection.
- Major success icons use a transparent circular field with a 6px accent border and a visually matched check stroke.

## Layout rules

- Use a centered page shell for singular outcomes and compact management tasks.
- On mobile, successful outcome screens may dissolve the outer card border and shadow into the page while retaining a bordered inner details card.
- Test vertical centering against short viewports. If content exceeds the viewport, normal scrolling must win over forced centering.
- Use document flow for long prose and complex forms.
- The public booking page has separate mobile and desktop markup trees. Verify both after any affected change.

## Interaction semantics

- A link navigates or opens a resource. A button performs an in-place action or submits a form.
- Visual weight follows task importance, but semantics do not change to achieve a style.
- Primary destructive actions may be red and button-like.
- Escape routes are tertiary but discoverable: accent color, `link-underline`, and an adequate invisible touch area.
- Avoid hover effects that alter line height. Use the shared `link-underline` behavior.
- Decorative SVGs paired with complete text labels use `aria-hidden="true"`.

## Component model

Build and migrate toward four layers:

1. Tokens in `src/app.css` and Tailwind configuration.
2. Public primitives under `src/lib/components/public/`.
3. Booking-domain patterns under `src/lib/components/booking/`.
4. Route files that mostly wire data and compose those pieces.

Initial primitives should remain small and demonstrated by existing repetition:

- `PublicPageShell`
- `PublicCard`
- `TextLink`
- `Notice`
- `StatusIcon`

Domain patterns include `BookingSummary`, `BookingSuccess`, and `BookingActions`.

Do not abstract every wrapper. A component needs a meaningful contract, repeated use, behavior, accessibility responsibility, or variants. One-off spatial composition should remain Tailwind utilities in the page.

## Variants

- `PublicPageShell`: `centered` or `document`; widths `narrow`, `booking`, `wide`.
- `PublicCard`: `plain`, `outlined`, `raised`.
- `TextLink`: `default`, `muted`, `danger`.
- `Notice`: `info`, `attention`, `danger`, `success`.
- `StatusIcon`: `success`, `attention`, `danger`; the large confirmation treatment is reserved for completed outcomes.

Use explicit static class maps for variants. Do not construct Tailwind class names dynamically.

## Status language

- Neutral information uses ordinary surfaces and text.
- Attention means something deserves notice but is not yet an error.
- Danger means failure, destructive choice, or irreversible consequence.
- Success confirms a completed outcome.
- Do not use red merely to distinguish old from new. Use labels, hierarchy, and neutral contrast for comparisons.

## Visual QA contract

Every public visual change should identify:

- Routes and states affected.
- Phone, tablet, short-laptop, and desktop coverage as appropriate.
- Light and dark theme impact.
- Loading, empty, error, selected, focus, hover, disabled, and success states affected.
- Whether fixture or preview data is deterministic and non-transactional.

During iteration, use local previews only. Never create, cancel, or reschedule real meetings for visual QA. Run `git diff --check`; run the full production build after the batch stabilizes.

## Agent checklist

1. Read this file, `docs/STYLE-MAP.md`, and relevant route/component code.
2. Inspect `/design-system` and the approved reference state.
3. Search for an existing primitive or pattern before adding styles.
4. Keep semantic colors aligned with meaning.
5. Preserve complete static Tailwind class names.
6. Change only affected markup trees.
7. Verify responsive and interaction states locally.
8. Do not broaden into infrastructure work without explicit authorization.

## Dashboard sibling system

The authenticated management dashboard shares CloudMeet's brand character (dark-first, cream light mode, orange accent) but uses denser task-oriented typography and its own namespaced tokens to avoid colliding with public-flow.

### Tokens

- Applied via `.dashboard-flow` on the outermost wrapper of each dashboard page (`DashboardPageShell`).
- CSS variables use the `--dash-*` prefix (`--dash-bg`, `--dash-surface`, `--dash-accent`, etc.).
- Tailwind maps them as `dash-bg`, `dash-surface`, `dash-text`, `dash-accent`, and related utilities in `tailwind.config.js`.

### Primitives

Located under `src/lib/components/dashboard/primitives/` and exported from `$lib/components/dashboard`:

- `DashboardPageShell`, `DashboardHeader`, `DashboardSection`, `DashboardCard`
- `DashboardButton`, `DashboardField`, `DashboardNotice`, `DashboardStatusBadge`
- `DashboardEmptyState`, `DashboardIconButton`, `DashboardToggle`, `DashboardDialog`, `DashboardSpinner`

Domain components (`BookingsList`, `EventTypesList`, `ProfileSection`, `CalendarSettings`, modals) compose these primitives. Prefer extending primitives over page-local gray/blue utility stacks.

### Visual QA

- Loopback-only previews live under `/__preview/dashboard/*` with deterministic fixtures in `src/lib/preview/sampleDashboard.ts`.
- The dashboard catalog is at `/design-system/dashboard` (loopback-only).
- V1 booking notifications are Google Calendar invitations; do not claim an active transactional email or reminder provider on dashboard copy.
