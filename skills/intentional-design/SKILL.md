---
name: intentional-design
description: "Design or review interaction-led product UX and UI. Use when a screen, flow, onboarding, dashboard, educational tool, or visualisation needs a meaningful primary user loop, functional micro-interactions, progressive disclosure, responsive system feedback, recovery, or a coherent interaction tone. Use especially when an interface is static, bland, animated without purpose, or needs to teach a complex concept through direct manipulation. Do not use merely to add decorative animation."
---

# Intentional Design

Design the interaction model before the layout. The product should make a user's action, the resulting state change, and the next useful move clear.

## Scope

Own the primary interaction loop, interaction contracts, progressive disclosure, and system feedback. Let accessibility, design-system, domain-research, calculation, and implementation skills own their specialised work. Use `$doakes` when an interaction drifts from the product outcome and `$ship-sound-code` for accepted implementation.

Read [interaction-guidelines.md](references/interaction-guidelines.md) when designing feedback states, motion, sensory cues, tone, recovery, or a complex learning flow.

## Establish the primary loop

Before proposing a layout, state:

`For <user in context>, repeatedly <meaningful action> to <achieve or understand outcome>; the product responds by <observable change>.`

The action must be deliberate: choose, compare, inspect, arrange, transform, create, refine, confirm, recover, or continue. Do not use viewing, reading, scrolling, engagement, or time spent as the primary action unless that is genuinely the product’s value.

Then state:

`trigger → rule/state change → feedback → next useful action or recovery`

If the loop cannot be written, do not design the screen. Ask one focused question or label the loop as an assumption. Do not hide the missing loop behind a dashboard, generic cards, explanation copy, or animation.

For an educational or visual product, make each interaction reveal one relationship the user needs to understand. The result should be assembled through meaningful actions, not shown fully formed and explained afterwards.

## Define interaction contracts

Treat a micro-interaction as a focused, single-purpose loop—not as a small animation. For each material interaction, define:

1. **Trigger:** deliberate user action or meaningful system event.
2. **Rule:** validation, condition, or state transition.
3. **Feedback:** immediate proof of recognition and change.
4. **Mode:** the persistent selected, pending, error, undoable, completed, or awaiting-input state.
5. **Recovery:** undo, edit, retry, correction, or why none is possible.

Keep every contract tied to a user job: understanding, progress, error prevention, recovery, decision-making, or system status. A hover effect, entrance fade, looping background, generic bounce, or colour swap alone is not a micro-interaction.

For a visualisation or learning tool, prefer direct manipulation of domain objects over explanatory panels. Let the action reveal the relationship; add text only to name or clarify it.

## Compose and validate

Reveal only what supports the next useful action. Keep safety, cost, permission, and irreversible consequences visible at the relevant decision point.

Before accepting the design, answer:

1. What is the first meaningful action?
2. What exact state changes?
3. What immediate feedback proves it?
4. What does the user now understand, achieve, or do next?
5. How do they undo, correct, or continue?

If an answer is vague, redesign the loop. If the UI works identically as a static screenshot, it is not interaction-led.

## Report concisely

Return only:

- **Primary loop:** user → action → state change → outcome.
- **Interaction contracts:** at most three, each as trigger → rule → feedback → mode/recovery.
- **Progressive path:** what appears first, next, and only when needed.
- **Tone and feedback:** interaction tone, feedback choice, and reduced-motion fallback.
- **Risk:** one material ambiguity, trust/accessibility issue, or missing proof.

Do not list animations as micro-interactions. Do not proceed to layout before the primary loop is proven.
