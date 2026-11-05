---
name: intentional-design
description: "Design or review task-first product UX and UI with purposeful expression and honest choice. Use when a screen, flow, onboarding, empty state, pricing, permissions, notifications, retention flow, dashboard, educational tool, or visualisation needs a meaningful primary user loop, functional micro-interactions, progressive disclosure, responsive system feedback, recovery, or a coherent interaction tone. Use especially when an interface is static, bland, animated without purpose, or needs to teach a complex concept through direct manipulation. Do not use merely to add decorative animation."
---

# Intentional Design

Start from the immediate user task. For interaction-heavy or learning products, establish the interaction model before layout; simple task screens need a clear action and result, not an invented repeated loop. The product should make a user's action, the resulting state change, and the next useful move clear.

## Scope

Own the primary interaction loop, interaction contracts, progressive disclosure, and system feedback. Let accessibility, design-system, domain-research, calculation, and implementation skills own their specialised work. Use `$doakes` when an interaction drifts from the product outcome and `$ship-sound-code` for accepted implementation.

Read [interaction-guidelines.md](references/interaction-guidelines.md) when designing feedback states, motion, sensory cues, tone, recovery, or a complex learning flow.

## Establish the task and behavioural fit

State: `For <user in context>, complete <action> with <relevant constraint>.`

Before adding a feature or feedback, state a behavioural hypothesis: `When <user> is <situation>, <friction> prevents <job>; <response> helps <user benefit>.` Prefer research and support evidence, then task observation, then analytics and domain constraints; label assumptions. Metrics describe behaviour without proving intent. Consider familiarity, repetition, interruptions, risk, and accessibility where they change the decision. Prefer task success, comprehension, time saved, and recovery over clicks or time spent.

For settings, forms, checkout, and other simple task screens, define `current state → action → result → recovery or why recovery is unavailable`. Proceed to layout once these are clear. Do not require repetition or reveal routine content through artificial interactions.

## Establish the primary loop for interaction-heavy products

Before proposing a layout, state:

`For <user in context>, repeatedly <meaningful action> to <achieve or understand outcome>; the product responds by <observable change>.`

The action must be deliberate: choose, compare, inspect, arrange, transform, create, refine, confirm, recover, or continue. Do not use viewing, reading, scrolling, engagement, or time spent as the primary action unless that is genuinely the product’s value.

Then state:

`trigger → rule/state change → feedback → next useful action or recovery`

For interaction-heavy or learning products, resolve a missing loop before layout. Ask one focused question or label the loop as an assumption. Do not hide the missing loop behind a dashboard, generic cards, explanation copy, or animation.

Where exploration advances an educational or visual product, make each interaction reveal one relationship the user needs to understand. The result should be assembled through meaningful actions, not shown fully formed and explained afterwards.

## Define interaction contracts

Treat a micro-interaction as a focused, single-purpose loop—not as a small animation. For each material interaction, define:

1. **Trigger:** deliberate user action or meaningful system event.
2. **Rule:** validation, condition, or state transition.
3. **Feedback:** immediate proof of recognition and change.
4. **Mode:** the persistent selected, pending, error, undoable, completed, or awaiting-input state.
5. **Recovery:** undo, edit, retry, correction, or why none is possible.

Keep every contract tied to a user job: understanding, progress, error prevention, recovery, decision-making, or system status. A hover effect, entrance fade, looping background, generic bounce, or colour swap alone is not a micro-interaction.

For a visualisation or learning tool, prefer direct manipulation of domain objects over explanatory panels. Let the action reveal the relationship; add text only to name or clarify it.

## Apply the element test

Keep a visible element only if it does at least one of these:

1. enable the next meaningful action;
2. establish location or current state that cannot be inferred otherwise; or
3. prevent a costly mistake by explaining a material consequence.

Remove, merge, or demote anything that merely names what adjacent content already demonstrates. Flag these recurring forms:

- **Concept echo:** product mission, framework, or feature concept restated in a screen that already embodies it;
- **orientation stack:** breadcrumb, page title, section title, and descriptive paragraph all identifying the same obvious view;
- **instructional narration:** prose that explains a familiar control instead of labelling it clearly;
- **empty-state filler:** generic encouragement that does not offer a recovery action; and
- **trust theatre:** privacy, care, or empowerment claims that do not add a concrete choice or fact.

Default to one orienting label per screen. Add a section heading only when it separates a different decision, dataset, mode, or time period. Use progressive disclosure for unfamiliar terms or consequential detail: one plain sentence first, with optional detail only when it changes the decision.

## Keep persuasion honest and quiet

Make a desired action prominent when it advances a user-chosen goal. Do not compensate for weak value with urgency, guilt, ambiguity, or friction.

For money, data, permissions, retention, and notifications:

- show the real cost, scope, timing, and consequence at the decision point;
- provide a clear decline, skip, cancel, downgrade, mute, or delete route;
- use scarcity, timers, availability, and social proof only when current backend data supports them;
- ask for data or commitments after relevant value is experienced, unless strictly necessary to deliver the first value; and
- provide natural stopping points and user controls rather than endless engagement loops.

Never add moralising reassurance to prove compliance. Prefer a truthful label and an accessible control: `£8/month after 7 days`, `Not now`, `Manage notifications`, or `Delete account`.

## Make expression purposeful

For tangible UI work, state an expression plan: interaction tone, visual character, and the user events worth making perceptible. Where the flow supports them, choose two or three purpose-linked moments across arrival, direct manipulation, and relationship or result reveal. Do not manufacture extra interactions for a simple screen. Avoid inert generic transitions and stacked spectacle; each detail must clarify state, continuity, progress, or understanding.

Use the reward inherent in the task: mastery, regained control, real progress, or completion. Add points, streaks, badges, or leaderboards only when they support a user-chosen outcome; reject mechanics whose only benefit is engagement or conversion. Keep milestones skippable and preserve natural stopping points.

Use factual, decision-relevant text and accessible labels. Avoid generic reassurance, product philosophy, and emoji unless requested. Preserve safety, legal disclosures, accessibility labels, and necessary unfamiliar-domain context.

## Compose and validate

Reveal only what supports the next useful action. Keep safety, cost, permission, and irreversible consequences visible at the relevant decision point.

Before accepting the design, answer:

1. What is the first meaningful action?
2. What exact state changes?
3. What immediate feedback proves it?
4. What does the user now understand, achieve, or do next?
5. How do they undo, edit, retry, or correct the result, or why is recovery unavailable?

If an answer is vague, clarify the task or interaction. For interaction-heavy products, verify the state transition in use; a screenshot cannot prove it. Review only the changed flow and its direct context for routine edits.

## Report concisely

Return a verdict and at most three material findings by default; include these details when relevant:

- **Task or primary loop:** user → action → state change → outcome.
- **Interaction contracts:** at most three, each as trigger → rule → feedback → mode/recovery.
- **Progressive path:** what appears first, next, and only when needed.
- **Tone and feedback:** interaction tone, feedback choice, and reduced-motion fallback.
- **Verdict:** remove or merge redundant elements; retain with purpose for orientation, safety, or recovery; ethical risk for hidden cost, fabricated scarcity, asymmetric exits, or pressure; research needed when audience context is uncertain. For each concern, give evidence, user cost, and the smallest correction. Correct material ethical risks before release.
- **Behavioural bet:** context → friction → response → user benefit → validation signal, when proposing a behavioural change.

Do not list animations as micro-interactions. For interaction-heavy products, establish the primary loop before layout. For simple task screens, use the task-and-result path above.
