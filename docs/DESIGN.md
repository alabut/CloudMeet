---
version: alpha
name: CloudMeet
description: >-
  Implementation contract for CloudMeet's visitor-facing public booking flow and
  the authenticated management dashboard. Normative token values are implemented
  in src/app.css and tailwind.config.js. This file lives at docs/DESIGN.md by
  repo convention (not a duplicate root DESIGN.md).
colors:
  primary: "#f15403"
  secondary: "#eeeeee"
  tertiary: "#ff7a33"
  neutral: "#111111"
  bg: "#111111"
  bg-secondary: "rgba(255, 255, 255, 0.1)"
  surface: "rgba(255, 255, 255, 0.1)"
  field-bg: "#1c1c1c"
  text: "#eeeeee"
  text-secondary: "rgba(255, 255, 255, 0.5)"
  border: "rgba(255, 255, 255, 0.15)"
  accent: "#f15403"
  accent-hover: "#ff7a33"
  bg-light: "#fcf9ee"
  field-bg-light: "#ffffff"
  text-light: "#222222"
  text-secondary-light: "rgba(0, 0, 0, 0.6)"
  border-light: "rgba(0, 0, 0, 0.15)"
  dash-bg: "#0f0f0f"
  dash-surface: "#1a1a1a"
  dash-surface-raised: "#222222"
  dash-field: "#1e1e1e"
  dash-text: "#e8e8e8"
  dash-text-secondary: "rgba(255, 255, 255, 0.45)"
  dash-border: "rgba(255, 255, 255, 0.12)"
  dash-accent: "#f15403"
  dash-accent-hover: "#ff7a33"
  dash-danger: "#f87171"
  dash-danger-surface: "rgba(248, 113, 113, 0.12)"
  dash-danger-border: "rgba(248, 113, 113, 0.35)"
  dash-attention: "#fbbf24"
  dash-attention-surface: "rgba(251, 191, 36, 0.12)"
  dash-attention-border: "rgba(251, 191, 36, 0.35)"
  dash-bg-light: "#f7f4e9"
  dash-surface-light: "#ffffff"
  dash-text-light: "#1a1a1a"
  dash-danger-light: "#dc2626"
typography:
  display-md:
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: 32px
    fontWeight: 500
    lineHeight: 1.2
  body-lg:
    fontFamily: "Georgia, 'Times New Roman', Times, serif"
    fontSize: 20px
    fontWeight: 400
    lineHeight: 1.6
  body-lg-mobile:
    fontFamily: "Georgia, 'Times New Roman', Times, serif"
    fontSize: 22px
    fontWeight: 400
    lineHeight: 1.45
  body-sm:
    fontFamily: "Georgia, 'Times New Roman', Times, serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  label-caps:
    fontFamily: "Menlo, 'Courier New', Courier, monospace"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0.04em
  dash-body:
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.5
  dash-label-caps:
    fontFamily: "Menlo, 'Courier New', Courier, monospace"
    fontSize: 11px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0.04em
rounded:
  sm: 10px
  md: 20px
  lg: 20px
  full: 9999px
spacing:
  gutter: 20px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
components:
  public-page-shell:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.text}"
    padding: "{spacing.gutter}"
  public-secondary-surface:
    backgroundColor: "{colors.bg-secondary}"
    textColor: "{colors.text}"
  public-theme-light:
    backgroundColor: "{colors.bg-light}"
    textColor: "{colors.text-light}"
  public-field-light:
    backgroundColor: "{colors.field-bg-light}"
    textColor: "{colors.text-light}"
  public-muted-light:
    textColor: "{colors.text-secondary-light}"
    typography: "{typography.body-sm}"
  public-card-outlined:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
  public-card-raised:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
  public-notice-info:
    backgroundColor: "{colors.field-bg}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
  public-notice-attention:
    backgroundColor: "rgba(245, 158, 11, 0.1)"
    textColor: "#fbbf24"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
  public-notice-danger:
    backgroundColor: "rgba(239, 68, 68, 0.1)"
    textColor: "#f87171"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
  public-notice-success:
    backgroundColor: "rgba(241, 84, 3, 0.1)"
    textColor: "{colors.accent}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
  public-text-link-default:
    textColor: "{colors.accent}"
    typography: "{typography.body-sm}"
    padding: "10px 8px"
  public-text-link-default-hover:
    textColor: "{colors.accent-hover}"
    typography: "{typography.body-sm}"
    padding: "10px 8px"
  public-text-link-muted:
    textColor: "{colors.text-secondary}"
    typography: "{typography.body-sm}"
    padding: "10px 8px"
  public-status-icon-success-large:
    backgroundColor: transparent
    textColor: "{colors.accent}"
    rounded: "{rounded.full}"
    size: 96px
  dash-page-shell:
    backgroundColor: "{colors.dash-bg}"
    textColor: "{colors.dash-text}"
    typography: "{typography.dash-body}"
  dash-theme-light:
    backgroundColor: "{colors.dash-bg-light}"
    textColor: "{colors.dash-text-light}"
    typography: "{typography.dash-body}"
  dash-surface-light:
    backgroundColor: "{colors.dash-surface-light}"
    textColor: "{colors.dash-text-light}"
  dash-button-primary:
    backgroundColor: "{colors.dash-accent}"
    textColor: "#ffffff"
    rounded: 6px
    padding: "8px 16px"
    typography: "{typography.dash-body}"
  dash-button-primary-hover:
    backgroundColor: "{colors.dash-accent-hover}"
    textColor: "#ffffff"
    rounded: 6px
    padding: "8px 16px"
    typography: "{typography.dash-body}"
  dash-button-secondary:
    backgroundColor: "{colors.dash-surface}"
    textColor: "{colors.dash-text}"
    rounded: 6px
    padding: "8px 16px"
    typography: "{typography.dash-body}"
  dash-card-outlined:
    backgroundColor: "{colors.dash-surface}"
    textColor: "{colors.dash-text}"
    rounded: 8px
    padding: "{spacing.md}"
  dash-card-raised:
    backgroundColor: "{colors.dash-surface-raised}"
    textColor: "{colors.dash-text}"
    rounded: 8px
    padding: "{spacing.md}"
  dash-notice-info:
    backgroundColor: "{colors.dash-field}"
    textColor: "{colors.dash-text}"
    rounded: 8px
    padding: "{spacing.sm}"
  dash-notice-attention:
    backgroundColor: "{colors.dash-attention-surface}"
    textColor: "{colors.dash-attention}"
    rounded: 8px
    padding: "{spacing.sm}"
  dash-notice-danger:
    backgroundColor: "{colors.dash-danger-surface}"
    textColor: "{colors.dash-danger}"
    rounded: 8px
    padding: "{spacing.sm}"
  dash-notice-danger-light:
    backgroundColor: "{colors.dash-danger-surface}"
    textColor: "{colors.dash-danger-light}"
    rounded: 8px
    padding: "{spacing.sm}"
  dash-meta-secondary:
    textColor: "{colors.dash-text-secondary}"
    typography: "{typography.dash-label-caps}"
---

## Overview

CloudMeet should feel like a focused extension of [alabut.com](https://alabut.com) rather than a stock scheduling product: warm, editorial, and personal rather than corporate SaaS. The product is **dark-first** with a cream light mode driven by `prefers-color-scheme`. Orange accent (`accent`, `#f15403`) signals focus, selection, success, and navigational emphasis—not indiscriminate decoration.

This document is the implementation contract for agents and maintainers. The local `/design-system` route is the human-facing visual catalog. **`docs/BREAKPOINT.md` remains authoritative** for product and infrastructure breakpoints.

### Scope and authority

- **Public booking flow** (this file's primary token layer): booking, confirmation, cancellation, rescheduling, reschedule-response, privacy, and public error states. Tokens live on `:root` and apply via the `.public-flow` wrapper.
- **Authenticated dashboard** (sibling system): denser task-oriented UI with namespaced `--dash-*` tokens on `.dashboard-flow`. Catalog at `/design-system/dashboard`; loopback previews at `/__preview/dashboard/*`.
- Preserve working booking behavior, Zoom wording, Google Calendar invitation behavior, and separate mobile/desktop booking markup unless a task explicitly changes them.
- Before adding page-local styles, inspect the visual catalog and existing primitives. Reuse or extend the smallest appropriate component.

### Product character

- Serif body and detail copy; restrained sans-serif display headings; monospaced metadata.
- Generous vertical rhythm and deliberate centering where the task is singular.
- Quiet borders and surfaces. Avoid stacks of gray boxes.
- Destructive red is reserved for destructive actions, irreversible warnings, and actual errors. Historical or currently selected information stays neutral.

### Architecture layers

1. **Tokens** — `src/app.css` CSS variables mapped in `tailwind.config.js`.
2. **Public primitives** — `src/lib/components/public/` (`PublicPageShell`, `PublicCard`, `TextLink`, `Notice`, `StatusIcon`).
3. **Booking-domain patterns** — `src/lib/components/booking/` (`BookingSummary`, `BookingSuccess`, `BookingActions`, `BookingForm`).
4. **Dashboard primitives** — `src/lib/components/dashboard/primitives/` (`DashboardPageShell`, `DashboardButton`, `DashboardCard`, `DashboardNotice`, and related).
5. **Route files** — wire data and compose the layers above.

Do not abstract every wrapper. A component needs a meaningful contract, repeated use, behavior, accessibility responsibility, or variants. One-off spatial composition should remain Tailwind utilities in the page. Use **complete, static class names** in variant maps; Tailwind cannot reliably detect dynamically assembled class names.

## Colors

The palette is dark-first. Light-mode overrides swap canvas and text neutrals while **accent orange stays constant** in both themes.

### Public-flow roles (dark default)

| Token | Role |
|-------|------|
| `bg` | Page canvas (`#111111` dark; `#fcf9ee` cream light) |
| `field-bg` | Solid inner surface for details and controls |
| `surface` / `bg-secondary` | Subtle secondary surface—do not stack repeatedly |
| `text` | Primary content |
| `text-secondary` | Supporting copy and metadata |
| `border` | Quiet structure |
| `accent` / `primary` | Active, selected, successful, and navigational emphasis |
| `accent-hover` / `tertiary` | Interactive hover emphasis |

### Dashboard roles (`.dashboard-flow`)

Dashboard tokens use the `dash-*` prefix in Tailwind (`dash-bg`, `dash-surface`, `dash-accent`, etc.) to avoid collision with public-flow. Semantic status colors include `dash-danger`, `dash-attention`, and their surface/border pairs. Light-mode dashboard values are defined in `src/app.css` under the `prefers-color-scheme: light` block.

### Status language

- **Neutral** — ordinary surfaces and text.
- **Attention** — deserves notice but is not yet an error (amber).
- **Danger** — failure, destructive choice, or irreversible consequence (red).
- **Success** — completed outcome (accent orange, not generic green).
- Do not use red merely to distinguish old from new. Use labels, hierarchy, and neutral contrast for comparisons.

## Typography

### Public flow (`.public-flow`)

| Tailwind utility | Stack | Usage |
|------------------|-------|-------|
| `font-display` | Helvetica Neue / Arial sans | Headings and primary UI labels (`fontWeight: 500`) |
| `font-serif` | Georgia serif | Body, explanatory, and event-detail copy |
| `font-meta` | Menlo monospace | Dates, durations, labels; typically uppercase with tracking |

Body copy defaults to **20px** with **160% line height**; mobile (`max-width: 576px`) bumps to **22px** at **145% line height**. Font-size scale: `text-large` (32px), `text-body`, `text-body-mobile`, `text-small` (16px), `text-extrasmall` (12px).

**iOS form-control floor:** `input`, `textarea`, and `select` are forced to **16px minimum** in `src/app.css` to prevent Safari auto-zoom on focus.

### Dashboard flow (`.dashboard-flow`)

Denser task UI: **15px** body at **150% line height**. Utility classes: `dash-heading` (sans, medium weight), `dash-detail` (serif), `dash-meta` (11px uppercase mono with `0.04em` tracking).

## Layout

### Public-flow layout

- `p-gutter` (`20px`) is standard viewport edge protection.
- `PublicPageShell` layouts: `centered` (flex column, min-h-screen, vertical center) or `document` (top-aligned with `py-10 sm:py-12`).
- Width variants: `narrow` (`max-w-md`), `booking` (`max-w-2xl`), `wide` (`max-w-4xl`).
- Use a centered page shell for singular outcomes and compact management tasks.
- On mobile, successful outcome screens may dissolve the outer card border and shadow into the page while retaining a bordered inner details card.
- Test vertical centering against short viewports. If content exceeds the viewport, normal scrolling must win over forced centering.
- Use document flow for long prose and complex forms.
- The public booking page has **separate mobile and desktop markup trees**. Verify both after any affected change.

### Dashboard layout

`DashboardPageShell` wraps each dashboard page with `.dashboard-flow`. Domain components (`BookingsList`, `EventTypesList`, `ProfileSection`, etc.) compose dashboard primitives. Prefer extending primitives over page-local gray/blue utility stacks.

## Elevation & Depth

Depth is conveyed through **quiet borders and tonal surfaces**, not heavy shadow stacks.

- **Public `PublicCard`**: `plain` (no border), `outlined` (border + `rounded-large`), `raised` (border + `shadow-lg`).
- **Dashboard `DashboardCard`**: same three variants with `dash-*` surfaces; `raised` adds `shadow-lg`.
- Avoid stacking multiple secondary-surface boxes. One bordered details card inside a page shell is usually enough.
- Mobile success states may drop outer card elevation while keeping an inner bordered details card.

## Shapes

| Token / utility | Value | Usage |
|-----------------|-------|-------|
| `rounded-large` / `rounded.md` | 20px | Major shells (`PublicCard`, `Notice`) |
| `rounded-lg` | Tailwind default (~8px) | Nested details, form controls, dashboard cards |
| `rounded-small` / `rounded.sm` | 10px | Smaller nested elements |
| `rounded-full` | circle | `StatusIcon` confirmation treatment |

Major success icons use a transparent circular field with a **6px accent border** and a visually matched check stroke (`StatusIcon` `size="large"`).

## Components

### Public primitives (`src/lib/components/public/`)

| Component | Variants | Notes |
|-----------|----------|-------|
| `PublicPageShell` | `layout`: `centered` \| `document`; `width`: `narrow` \| `booking` \| `wide` | Applies `.public-flow` |
| `PublicCard` | `plain` \| `outlined` \| `raised` | Padding `p-6 sm:p-8` |
| `TextLink` | `default` \| `muted` \| `danger`; `underline` toggle | Escape routes use accent + `link-underline` |
| `Notice` | `info` \| `attention` \| `danger` \| `success` | `danger` uses `role="alert"` |
| `StatusIcon` | `success` \| `attention` \| `danger`; `size`: `default` \| `large` | Large success reserved for completed outcomes; `aria-hidden="true"` |

### Booking patterns (`src/lib/components/booking/`)

`BookingSummary`, `BookingSuccess`, and `BookingActions` compose public primitives. Form fields use `bg-[var(--field-bg)]`, `border-border`, `rounded-lg`, and `focus:ring-2 focus:ring-accent`.

### Dashboard primitives (`src/lib/components/dashboard/primitives/`)

| Component | Variants | Notes |
|-----------|----------|-------|
| `DashboardButton` | `primary` \| `secondary` \| `ghost` \| `danger`; `size`: `sm` \| `md` | Supports `href` or `button` |
| `DashboardCard` | `plain` \| `outlined` \| `raised` | Padding `p-4 sm:p-5` |
| `DashboardNotice` | `info` \| `attention` \| `danger` \| `success` | Optional `live` for `aria-live` |
| `DashboardPageShell`, `DashboardHeader`, `DashboardSection`, `DashboardField`, `DashboardStatusBadge`, `DashboardEmptyState`, `DashboardIconButton`, `DashboardToggle`, `DashboardDialog`, `DashboardSpinner` | — | See `/design-system/dashboard` |

### Interaction semantics

- A **link** navigates or opens a resource. A **button** performs an in-place action or submits a form.
- Visual weight follows task importance, but semantics do not change to achieve a style.
- Primary destructive actions may be red and button-like.
- Escape routes are tertiary but discoverable: accent color, `link-underline`, and an adequate invisible touch area.
- Avoid hover effects that alter line height. Use the shared `link-underline` utility.
- Decorative SVGs paired with complete text labels use `aria-hidden="true"`.

### Visual QA contract

Every public visual change should identify:

- Routes and states affected.
- Phone, tablet, short-laptop, and desktop coverage as appropriate.
- Light and dark theme impact.
- Loading, empty, error, selected, focus, hover, disabled, and success states affected.
- Whether fixture or preview data is deterministic and non-transactional.

During iteration, use local previews only. Never create, cancel, or reschedule real meetings for visual QA. Run `git diff --check`; run the full production build after the batch stabilizes. Dashboard previews use fixtures in `src/lib/preview/sampleDashboard.ts`. V1 booking notifications are Google Calendar invitations—do not claim an active transactional email or reminder provider on dashboard copy.

## Do's and Don'ts

**Do**

- Read this file, `docs/STYLE-MAP.md`, and relevant route/component code before changing UI.
- Inspect `/design-system` and the approved reference state.
- Search for an existing primitive or pattern before adding styles.
- Keep semantic colors aligned with meaning (accent for success/navigation, red only for danger).
- Preserve complete static Tailwind class names in variant maps.
- Change only affected markup trees (public mobile vs desktop, or dashboard).
- Verify responsive and interaction states locally.
- Extend tokens in `src/app.css` and `tailwind.config.js`—this DESIGN.md documents them; it does not replace them as source of truth.

**Don't**

- Stack multiple `surface` / `bg-secondary` boxes for depth.
- Use red to distinguish historical from current information.
- Construct Tailwind class names dynamically.
- Apply public-flow tokens inside `.dashboard-flow` (or vice versa).
- Broaden into infrastructure, OAuth, deployment, or production booking work without explicit authorization.
- Treat `design.md export` output as a competing source of truth over `src/app.css` and `tailwind.config.js`.

### Agent checklist

1. Read this file, `docs/STYLE-MAP.md`, and relevant route/component code.
2. Inspect `/design-system` and the approved reference state.
3. Search for an existing primitive or pattern before adding styles.
4. Keep semantic colors aligned with meaning.
5. Preserve complete static Tailwind class names.
6. Change only affected markup trees.
7. Verify responsive and interaction states locally.
8. Do not broaden into infrastructure work without explicit authorization.
