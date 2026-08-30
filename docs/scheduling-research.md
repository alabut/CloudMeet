# Scheduling-page research for CloudMeet

## Scope

This report studies current scheduling-product patterns that are relevant to Al Abut’s personal booking page. It focuses on purpose-based meeting types, direct/private links, trust-building context, mobile flow, intake questions, and professional polish. It is research and product guidance only; it does not prescribe implementation of every idea.

## Executive recommendation

Keep the custom scheduler’s calendar-first experience, but stop treating duration as the primary product identity. A visitor should understand why they are booking before they see “30 minutes.” Use a small public set of clear-purpose meeting types and durable, unlisted URLs for specialized conversations. Add only one or two high-signal intake questions per type.

The safest first experiment is to retain `/30min` as a compatibility route while introducing purpose-based aliases that reuse the existing scheduler:

- `/intro` — Intro / Get to Know Each Other
- `/portfolio-review` — Portfolio Review
- `/product-design` — Product Design Conversation
- `/hoa-security` — HOA Security System Consultation
- `/admin-automation` — HOA Backoffice Automation Consultation

The duration remains useful metadata, e.g. “30 min,” but should not be the headline.

## What established scheduling tools suggest

### Event types should represent occasions, not just lengths

Cal.com describes event types as pre-set meetings or consultations, each with its own name, URL, duration, availability, and location. Its examples distinguish “Job Interview” from “Performance Review,” even though duration is only one configuration dimension. This supports naming links around the visitor’s intent rather than “15/20/30 minute meeting.”

Source: [Cal.com Event Types](https://cal.com/help/event-types/event-types)

SavvyCal uses the same mental model: each scheduling link has a title and description, link type, duration, attendees, availability, conferencing location, booking-page options, and automations. Its documentation also says links are lightweight and that users can create many for different meeting types.

Source: [SavvyCal introduction](https://docs.savvycal.com/article/63-introduction-to-savvycal)

### Hidden event types are a mature pattern for targeted audiences

Cal.com distinguishes a hidden event from a private single-use link. A hidden event remains a normal durable event but does not appear on the public profile; someone needs the direct URL. A private link is anonymized and single-use. This distinction maps well to Al’s idea of sending a business-specific URL without exposing every offering publicly.

Recommendation: begin with durable unlisted routes such as `/hoa-security` and `/admin-automation`. Do not build expiring-token links until there is a concrete privacy or abuse problem.

Sources: [Cal.com FAQ](https://cal.com/faq), [Cal.com hidden events and private links](https://cal.com/blog/mastering-cal-com-hidden-events-and-private-links-explained)

### Intake should be minimal and purpose-driven

Calendly’s routing-form guidance warns that additional effort can reduce completion. It recommends asking what is necessary to route or qualify the visitor, then collecting more detail after the person reaches the appropriate event type. This argues against a large “tell me everything” application form on a personal booking page.

Source: [Calendly: Screen and qualify people before they book](https://calendly.com/blog/routing-forms/)

SavvyCal supports short text, long text, radio buttons, checkboxes, select menus, URLs, and hidden prefilled fields. Its documentation places custom questions on the confirmation step, which is a useful model for preserving the low-friction calendar selection flow.

Source: [SavvyCal custom questions](https://docs.savvycal.com/article/70-adding-custom-questions-to-scheduling-links)

### Routing forms are useful only when the menu becomes ambiguous

Cal.com and Calendly both support routing forms: ask a few questions, then direct the visitor to the appropriate appointment type or URL. That is valuable for teams or businesses with many services, but unnecessary when Al has only a handful of clear links.

Sources: [Cal.com routing forms](https://cal.com/faq), [Calendly routing](https://calendly.com/blog/routing-forms/)

### White-label domains are polish, not the first product decision

SavvyCal offers custom domains such as `booking.example.com/name/chat` for a more white-label experience. For CloudMeet, a future `meet.alabut.com` or `alabut.com/schedule/...` structure could make links feel more intentional, but this requires DNS and deployment work and should follow validation of the event taxonomy.

Source: [SavvyCal custom domains](https://docs.savvycal.com/article/116-custom-domains)

## Recommended information architecture

### Public landing page

The public page should introduce Al briefly, explain the kinds of conversations available, and make the next choice obvious. It can show a compact directory such as:

| Meeting type | Supporting description | Duration |
| --- | --- | --- |
| Intro / Get to Know Each Other | A general conversation about what you’re working on or exploring. | 30 min |
| Product Design Conversation | Talk through a product, design challenge, or early idea. | 30 min |
| Portfolio Review | Get focused feedback on a portfolio, case study, or interview presentation. | 30 min |

Business-specific offers can remain unlisted and be shared directly.

### Direct event pages

Every direct URL should open directly to its own title, description, location, and calendar—not to an unrelated generic directory. The event description should answer three questions:

1. Who is this for?
2. What will we discuss?
3. What should the visitor bring or expect?

Examples:

**Portfolio Review**

> A practical review of your portfolio, case study, or interview presentation. Bring a link and one area where you want candid feedback.

**HOA Security System Consultation**

> A first conversation about webcam-based security for a small apartment complex or HOA. We’ll discuss the property, coverage goals, resident concerns, and whether a lightweight pilot makes sense.

**HOA Backoffice Automation Consultation**

> Explore ways to reduce repetitive HOA administrative work with templates, AI-assisted workflows, or custom internal tools. Bring one process that currently consumes too much time.

## Concrete intake-question recommendations

Use one required question and at most one optional question per specialized event. Suggested fields:

### Portfolio review

- Required: “What role or opportunity are you preparing for?”
- Optional: “Share a portfolio or case-study link.”

### Product design

- Required: “What product or design question should we focus on?”
- Optional: “Share a link or short context if useful.”

### HOA security

- Required: “How many buildings or units are involved?”
- Optional: “What are you hoping to improve: deterrence, incident review, resident confidence, or something else?”

### HOA automation

- Required: “What repetitive workflow currently takes the most time?”
- Optional: “What tools or documents are part of that workflow today?”

Avoid collecting phone number, budget, company size, and a long project brief by default. Those may be appropriate after the initial conversation or for a qualified sales flow, but they make a personal booking page feel like an application.

## Mobile and conversion guidance

On mobile, the visitor should reach identity, meeting purpose, and the first useful calendar action quickly. Keep the portrait and bio compact, avoid duplicate identity treatments, and do not force a public event directory into a direct-link flow. A direct `/hoa-security` link should not make a prospect scroll past unrelated portfolio or networking options.

The final booking form should make timezone and location explicit. The confirmation state should include:

- selected date and timezone;
- Google Meet or other meeting location;
- cancellation and rescheduling actions;
- a short preparation note;
- a clear statement that a calendar invite will be sent.

Suggested confirmation copy:

> You’ll receive a Google Meet link automatically. If you have a relevant site, deck, floor plan, or workflow example, feel free to send it beforehand.

## Prioritization

### Tier 1 — high value, low complexity

1. Change headings from duration-first to purpose-first.
2. Keep duration as metadata.
3. Add event-specific descriptions and one high-signal intake question.
4. Create durable unlisted routes for specialized business conversations.
5. Tighten mobile identity and spacing.
6. Improve confirmation copy with timezone, location, and preparation guidance.

### Tier 2 — useful after observing real traffic

1. Add a small public event directory if more than three public choices exist.
2. Add a routing question only when visitors routinely choose the wrong link.
3. Add source/context fields via query parameters if there is a real need to understand referrals.
4. Add a custom `meet.alabut.com` domain after the URL taxonomy has stabilized.

### Tier 3 — defer until a concrete need exists

1. Single-use anonymized links.
2. Automated lead scoring or rejection.
3. A multi-step qualification wizard.
4. CRM synchronization and elaborate source attribution.
5. Separate scheduling backends for each audience.
6. A large catalog of industry-specific event types.

## Cautions against overengineering

Purpose-based URLs are valuable because they improve context and let Al tailor copy, availability, and intake. They become counterproductive when every possible conversation gets its own route. Start with a small set that corresponds to actual recurring conversations, and create a new event type only when at least one of these differs:

- the intended audience;
- the promise or agenda;
- the required preparation;
- the availability window;
- the meeting location;
- the intake information needed.

If only the duration differs, keep one purpose-based event and offer the duration as a configuration or follow-up choice. If a business-specific page is not yet being sent to real prospects, document the concept but do not build its full workflow.

## Suggested validation loop

1. Introduce three purpose-based routes: Intro, Portfolio Review, and Product Design.
2. Keep `/30min` as an alias so existing links do not break.
3. Add the two business routes as unlisted experiments, not public navigation items.
4. Send each route to a small number of real recipients.
5. Observe whether people understand the page, complete bookings, and arrive prepared.
6. Only then decide whether routing, private tokens, custom domains, or CRM features are justified.

## Source index

- [Cal.com Event Types](https://cal.com/help/event-types/event-types)
- [Cal.com FAQ](https://cal.com/faq)
- [Cal.com: Hidden Events and Private Links](https://cal.com/blog/mastering-cal-com-hidden-events-and-private-links-explained)
- [Calendly: Screen and qualify people before they book](https://calendly.com/blog/routing-forms/)
- [SavvyCal introduction](https://docs.savvycal.com/article/63-introduction-to-savvycal)
- [SavvyCal custom questions](https://docs.savvycal.com/article/70-adding-custom-questions-to-scheduling-links)
- [SavvyCal custom domains](https://docs.savvycal.com/article/116-custom-domains)
