# Learning Tailwind through CloudMeet

## The short, human version

My first goal is to learn the Tailwind way before deciding where I prefer a hybrid.

That means breaking the instinct to recreate a traditional stylesheet full of custom class names. Tailwind is supposed to make most styling decisions visible where the interface is composed. When the same visual idea repeats, the primary reuse mechanism in Svelte should be a real component with a clear purpose—not another custom CSS class that hides a pile of declarations.

The basic rhythm I want to practice is:

1. Build a screen with Tailwind utilities so I can see exactly what each choice does.
2. Notice repetition only after it actually appears.
3. Extract repeated, meaningful UI into a reusable Svelte component.
4. Put shared design values—colors, type, spacing, radii—into tokens.
5. Keep one-off layout utilities close to the page instead of inventing a name for everything.
6. Use ordinary CSS when it is genuinely the clearest tool, not simply because it is familiar.

The important distinction is that reuse should follow meaning. A reusable `Notice` or `BookingSummary` component establishes behavior, accessibility, and visual defaults. A class called `.gray-box-with-padding` merely gives an arbitrary bundle of CSS a new name.

This project is also practice in agentic engineering. The design system should be easy for both me and an agent to inspect: a short written contract in `docs/DESIGN.md`, a visual catalog at the local `/design-system` page, deterministic preview states, and eventually screenshot tests. The machine-readable material below is intentionally more detailed so future agents can keep the system coherent.

## What I should be able to do

- Read a Tailwind class list without it feeling like noise.
- Adjust spacing, layout, typography, responsive behavior, and interaction states directly in markup.
- Know when repetition deserves a component and when it does not.
- Distinguish tokens, primitives, domain patterns, and page composition.
- Choose links versus buttons based on semantics rather than appearance.
- Diagnose short-screen and mobile layouts, not only desktop widths.
- Review an agent's UI diff against an explicit system and visual reference.
- Extend an existing product without letting every new page invent its own visual language.

---

# Appendix for agents and future instruction

This appendix is an implementation and teaching reference. Keep the human section above short. Future agents should use this material to guide exercises, reviews, and design-system changes without forcing all of it into every explanation.

## Architecture to reinforce

Use four layers:

1. **Tokens** — colors, typography, spacing, radii, shadows, and breakpoints. Prefer semantic names such as `surface`, `text-muted`, `accent`, and `danger-surface` over raw color names.
2. **Primitives** — reusable Svelte components with semantics and variants: `PublicPageShell`, `Card`, `TextLink`, `Action`, `Notice`, and form controls.
3. **Patterns** — domain-specific compositions such as `BookingSummary`, `ConfirmationPanel`, and `BookingActions`.
4. **Pages** — data wiring, content, and exceptional composition. Pages should not independently reinvent common buttons, panels, or status treatments.

Tailwind is a low-level styling API, not a requirement to style every page independently. In a component framework, Tailwind recommends extracting repeated UI into components. Cross-cutting CSS classes remain appropriate for a small number of behaviors, such as CloudMeet's `link-underline`, but an `@apply`-heavy catalog of classes recreates traditional CSS indirection.

## Decision rules

- If it has behavior, accessibility requirements, slots, or variants, make it a Svelte component.
- If it is a design decision used in multiple places, make it a token.
- If it is one reusable CSS behavior, make it a utility.
- If it is a one-off composition, keep the utilities in the page.
- Use complete, static class names in typed variant maps; Tailwind cannot reliably detect dynamically assembled class names.
- Give semantic states distinct roles: informational context must not use destructive red styling.
- Prefer consistent defaults with explicit exceptions over eliminating every utility from page markup.

## CloudMeet practice sequence

1. Inventory every public route and state, including success, empty, loading, error, expired-link, cancellation, and rescheduling states.
2. Normalize existing public design tokens before adding more components.
3. Extract only primitives demonstrated by repetition: `PublicPageShell`, `PublicCard`, `TextLink`, `Action`, `Notice`, `StatusIcon`, `BookingSummary`, and `ConfirmationPanel`.
4. Migrate related public flows together rather than editing files alphabetically.
5. Add variants only when a real screen needs them.
6. Keep the dashboard visually separate until its redesign is explicitly in scope.

Avoid turning every `div` into a component, importing an entire component kit for a few primitives, or performing a big-bang rewrite. Shadcn-svelte is useful as a source-owned architecture reference; Bits UI is useful for complex accessible behavior such as dialogs, popovers, and selects. Neither should dictate CloudMeet's aesthetic.

## Visual QA workflow

1. Maintain a route/state matrix as the coverage checklist.
2. Test narrow phone, tall phone, tablet, short laptop, and desktop. Height matters as much as width for vertically centered layouts.
3. Make states deterministic with fixed dates, time zones, fixture data, fonts, and disabled animation.
4. Use Storybook for isolated primitives and stateful patterns.
5. Use Playwright `toHaveScreenshot()` for complete routes and critical journeys, generating and comparing baselines in the same browser/OS environment.
6. Review screenshot changes as design decisions; update baselines only after intentional approval.
7. Supplement automated accessibility checks with keyboard, zoom, screen-reader, touch-target, and real-device review.

A cost-conscious first target is 10–20 canonical public route/state screenshots plus stories for the handful of shared primitives. Approved screenshots become executable design references instead of context that must be rediscovered in each agent conversation.

## Teaching curriculum

1. Modern CSS: cascade, inheritance, specificity, custom properties, intrinsic sizing, flexbox, grid, container queries, and responsive height.
2. Semantic HTML and accessibility: links versus buttons, landmarks, labels, focus, keyboard flow, touch targets, contrast, and reduced motion.
3. Tailwind mental model: utility composition, responsive/state/data variants, arbitrary values, source scanning, merging, and when plain CSS is clearer.
4. Design tokens: raw versus semantic values; theme roles for color, type, spacing, radius, and shadow; dark/light mapping.
5. Svelte UI architecture: composition, snippets, class forwarding, typed variants, primitives versus domain patterns, and avoiding premature abstraction.
6. Headless and source-owned UI: evaluating adopt, adapt, or build; Bits UI for behavior and shadcn-svelte for component recipes.
7. Responsive product design: content-driven breakpoints, short viewports, centered versus document flow, desktop density, and mobile touch affordances.
8. Visual QA: state matrices, fixtures, Storybook, screenshot baselines, accessibility automation, and real-device checks.
9. Agentic workflow: expressing design constraints, providing reference states, requiring reuse audits, reviewing diffs, and preventing local style drift.
10. Capstone: normalize one CloudMeet flow by defining tokens, extracting primitives, migrating three related pages, and adding multi-viewport regression coverage.

## Primary references

- [Tailwind: managing duplication](https://tailwindcss.com/docs/styling-with-utility-classes#managing-duplication)
- [Tailwind: adding custom styles](https://tailwindcss.com/docs/adding-custom-styles#adding-component-classes)
- [Tailwind: detecting classes](https://tailwindcss.com/docs/detecting-classes-in-source-files#dynamic-class-names)
- [Tailwind theme variables](https://tailwindcss.com/docs/theme)
- [Tailwind compatibility for Svelte](https://tailwindcss.com/docs/compatibility#vue-svelte-and-astro)
- [shadcn-svelte Button](https://shadcn-svelte.com/docs/components/button)
- [Bits UI](https://www.bits-ui.com/docs)
- [Storybook for SvelteKit](https://storybook.js.org/docs/get-started/frameworks/sveltekit)
- [Storybook viewport testing](https://storybook.js.org/docs/essentials/viewport)
- [Storybook accessibility testing](https://storybook.js.org/docs/writing-tests/accessibility-testing)
- [Playwright visual comparisons](https://playwright.dev/docs/test-snapshots)
