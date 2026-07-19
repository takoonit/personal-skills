---
name: intentional-design
description: "Design or review expressive, task-first product UI and interaction flows that benefit target users' real behaviour and goals. Use hierarchy, state, feedback, mature intrinsic gamification, and restrained micro-interactions instead of unnecessary headings, explanatory copy, reassurance, conceptual repetition, emoji, childish reward theatre, or manipulative persuasion. Use when creating or changing screens, onboarding, empty states, pricing, permissions, notifications, retention flows, progress systems, or behaviour-led UX improvements; especially when an AI-generated interface feels verbose, generic, or one to two steps removed from the user's task. Preserve necessary orientation, safety, informed choice, and accessible motion."
---

# Intentional Design

Design for a user's immediate task, not the product team's conceptual model. Intentional Design creates expression through hierarchy, visual rhythm, meaningful states, and restrained micro-reactions; use text only where it carries decision-critical meaning. Preserve orientation, safety, and ethical choice.

## Coexist with local skills

Let a specialised accessibility, design-system, framework, or user-research skill own its narrower work. Reuse its confirmed constraints. Retain this skill's role: exposing task-distance, redundant explanation, and coercive persuasion. Use `$doakes` when the requested interface change appears to drift from the product's core outcome; use `$ship-sound-code` for accepted implementation.

## Start from the task

State the smallest user task as: `For <user>, complete <action> with <relevant constraint>.`

Identify the current state, next action, and any irreversible or costly choice. Treat navigation context, selected state, meaningful content, and the primary control as orientation evidence before adding a page title or explanation.

Do not invent a product value proposition, feature tour, reassuring phrase, or motivational copy merely because a screen has empty space.

## Design from behavioural fit

Treat user behaviour as evidence of context and friction, not a lever to maximise clicks, time spent, or data extraction. State one behavioural hypothesis before adding a feature or micro-reaction:

`When <target user> is <situation>, they need to <job> but struggle with <observed or plausible friction>; <design response> helps them achieve <user benefit>.`

Ground the hypothesis in the best available evidence: direct research and support requests first; task observation and usability tests next; then analytics, domain constraints, and an explicitly labelled assumption. Analytics show what happened, not necessarily why. Do not infer intent from a metric alone.

Consider only the behaviour that changes the design decision:

- familiarity: first-time, returning, or expert use;
- frequency and repetition: occasional, habitual, or high-volume work;
- context: focused, interrupted, time-pressured, mobile, or collaborative use;
- risk: reversible action, expensive commitment, private data, or destructive change; and
- capability: accessibility needs, domain knowledge, confidence, and available attention.

Choose a response that reduces friction or prevents an error for that context:

- unfamiliar or occasional work → recognisable labels, progressive guidance, and a safe default;
- frequent, repetitive work → shortcuts, retained context, bulk actions, and low-friction confirmation;
- interruption-prone work → clear saved state, resumable context, undo, and non-intrusive reminders;
- time-pressured work → prioritised information, sensible defaults, and an explicit review path;
- high-consequence work → deliberate confirmation, visible consequence, and easy recovery.

Reject a response if its main effect is to increase engagement, conversion, or collection without a comparable user benefit. Do not pathologise normal use, engineer a dependency, or make a user's past behaviour harder to change.

## Make the interface speak without narrating

Express status and cause-and-effect through the interface before reaching for prose:

- use hierarchy, contrast, spacing, grouping, progress, and a clear primary action to establish attention and flow;
- make actions acknowledge themselves with a quick, purpose-linked state change: a saved value, an inserted item, a disabled duplicate action, or a concise success state;
- use motion only to reveal a relationship, confirm a completed action, or preserve spatial continuity; keep it short, interruptible, and compatible with reduced-motion preferences;
- use empty states to show the next useful action, not to repeat the product promise; and
- use colour and iconography as supporting signals, never as the only carrier of a consequential meaning.

Treat micro-reactions as interface feedback, not entertainment. Avoid routine, prominent celebratory effects, bouncing controls, animated counters, or persistent badges unless they correspond to a meaningful user event and can be skipped or disabled where appropriate.

Do not use emoticons or emoji in UI copy unless the user explicitly asks for them. Do not substitute emoji for accessible labels, status, or error explanation.

Use text when it changes a choice, communicates a state that cannot be reliably inferred, supplies an action label, prevents a costly mistake, or makes the interface accessible. Keep that text factual and specific; do not pad it with product philosophy, artificial warmth, or reassurance.

## Use mature gamification and feedback

Start with the reward already inherent in the user's work: visible progress, regained control, a completed task, a reduced backlog, a mastered skill, or an achieved real-world outcome. Add an external reward only when it strengthens that outcome rather than substituting for it.

Use this feedback hierarchy:

1. **Routine action:** immediate state change, concise confirmation, and a light visual or haptic acknowledgement where the platform supports it.
2. **Meaningful progress:** accurate progress, streak, or completion evidence only when it helps planning, mastery, or follow-through.
3. **Rare milestone:** restrained celebration only for a significant, user-valued achievement; never replay it for routine activity.

Make feedback feel direct, not theatrical. Target immediate acknowledgement for direct manipulation and keep routine UI motion brief—usually about 150–300 ms when the platform and action allow it. Do not treat timing as a rigid rule: network state, accessibility settings, complex spatial transitions, and platform conventions can require a different treatment.

Synchronise feedback with the action and its real result. Use one coherent signal at a time; avoid competing motion, sound, haptics, counters, and badges. Keep routine haptics light and optional where system settings allow. Reserve stronger visual or haptic feedback for rare, consequential milestones.

### Compose distinct delight

Make the product feel considered, recognisable, and alive through confident but controlled detail. Delight should arise from a satisfying response to the user's action—not from an announcement that the product is delightful.

Before composing a tangible screen, state an **expression plan**:

`Desired feeling → concept-specific visual motif → two or three signature moments → restraint rule.`

For example: `calm discovery → a chart gradually forming from connected layers → pillar selection, relationship trace, and completed insight → no competing celebration.`

Use a visual motif that belongs to the product's subject or user goal. Let it inform the composition, depth, colour, typography, shape, and motion. Do not default to a neutral card grid with muted colours merely because the task is serious. Equally, do not paste decoration over a generic layout. The interface should still have a recognisable point of view when its copy is hidden.

For a working interactive flow, include at least two of these perceptible moments where they fit:

- **Arrival:** the primary information assembles, reveals its structure, or establishes spatial depth;
- **Direct manipulation:** a pressed, selected, dragged, or changed object visibly reacts and settles into its new state;
- **Relationship reveal:** a user action traces, connects, expands, or transforms the information it affects;
- **Progression:** a real result grows, resolves, or becomes more legible as work is completed; or
- **Milestone:** a rare achievement earns a richer but still optional response.

Treat a bare colour swap, generic fade, or a 150 ms transition as implementation polish—not a signature moment. Make the effect perceptible enough to reward attention, while keeping it subordinate to the task and capable of being ignored. Do not mistake a muted palette, generous whitespace, or lack of movement for intentional design.

Use one or two understated details that fit the interaction and visual system, such as:

- a control settling into its new state with a refined easing curve;
- a brief colour, elevation, or highlight transition that makes a saved or completed state feel tangible;
- content appearing from the place the user created or moved it, preserving spatial continuity;
- a subtle progress fill, completion mark, or count transition that reflects a real result; or
- a light haptic tick paired exactly with a deliberate direct action, where the platform permits it.

Vary the detail by context; do not apply the same effect mechanically to every control. Give every important interaction an authored sequence: **resting state → anticipation or response → resolved state**. Keep it short enough to avoid waiting, but do not strip the sequence down until it becomes imperceptible. Stop at the first satisfying signal—do not stack glow, scale, sound, haptic, confetti, and copy around one action.

Choose delight only after the essential task, state, and consequence are clear. Do not use it to distract from a delay, failed action, hidden cost, or weak value proposition. Support reduced motion, and ensure the final state remains clear with all animation disabled.

Do not introduce points, badges, streaks, loot-like variable rewards, or leaderboards merely to make an ordinary task feel like a game. Before adding one, state:

`What real capability, progress, or user-chosen outcome does this make visible—and what happens if the mechanic is removed?`

If the answer is only engagement, return frequency, or conversion, reject it. Do not use reward systems, notifications, urgency, or loss framing to create anxiety about breaking a streak or missing an arbitrary benefit.

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

## Review proportionately

Inspect the screen or changed flow, direct neighbours, navigation context, visual state transitions, and the copy around consequential decisions. Do not demand a full audit for a routine button or layout change.

For each material concern, establish:

- **task distance:** what the user is trying to do and why the element does not help;
- **evidence:** the nearby state, control, or information that already supplies its meaning;
- **cost:** extra scan time, cognitive load, confused choice, or pressure; and
- **smallest correction:** remove, merge, shorten, move behind `Why?`, add a concrete control, or replace narration with a meaningful state or micro-reaction.

For a proposed behavioural improvement, also state the **behavioural bet**: target context → friction → design response → expected user benefit → proof to collect. Prefer task success, error recovery, time saved, comprehension, and voluntary return over raw engagement metrics.

Do not delete accessibility labels, error recovery, legal disclosures, or unfamiliar-domain context merely for brevity. If it is unclear whether a label carries essential meaning, retain it and mark it for user testing rather than guessing.

## Make the call

Classify each review result:

- **Remove or merge:** clearly redundant text, heading, or ornamental UI with no decision value.
- **Retain with purpose:** necessary orientation, context, safety, or recovery support.
- **Ethical risk:** misleading pressure, asymmetric exit, hidden cost, fabricated scarcity, or excessive attention demand. Pause and request a correction before release.
- **Research needed:** whether a complex audience truly needs context is unknown. Name the task to test rather than adding generic copy.

When asked to implement an accepted screen, remove only clear low-risk redundancy within the stated scope. Ask before changing information architecture, legal copy, pricing terms, commitments, or a product's primary conversion path.

## Report without creating more noise

Return a verdict and no more than three material findings by default:

- **Remove or merge — <element>:** task distance; evidence; smallest correction.
- **Keep — <element>:** the user decision or risk it supports.
- **Ethical risk — <interaction>:** pressure mechanism; user cost; required correction.
- **Behavioural bet — <change>:** context → friction → response → user benefit → validation signal.
- **Feedback choice — <interaction>:** user event → level of feedback → real progress or state made visible.
- **Delight detail — <interaction>:** subtle response → why it fits this moment → non-animated fallback.
- **Expression plan:** feeling → visual motif → signature moments → restraint rule.

End with the leanest viable screen direction, expression plan, and the two or three moments that make it feel authored. Do not add UX boilerplate, emoji, a generic principle list, or congratulatory reassurance when the interface is already clear.
