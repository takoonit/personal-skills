---
name: intentional-design
description: Design or critique task-focused product interfaces, hierarchy, states, and feedback. Use when a flow needs clearer interaction or purposeful expression; defer to an established design system.
---

# Intentional Design

Help the intended user complete a real task with clear state, useful feedback, and appropriate expression. Respect the product's existing design system and audience.

## Establish the task

Identify the user, action, context, current state, and any costly consequence. Reuse accepted research and constraints. For a review of an existing interface, inspect rendered evidence and the relevant states or viewport sizes before making visual findings. If unavailable, distinguish source-based observations from unverified appearance.

Use behavior as evidence of friction. Separate observation from a hypothesis about why it happens. Ask only for missing information that changes the design decision.

## Design rules

- Use hierarchy, grouping, labels, and a clear primary action to establish orientation. Add explanatory text when it changes a decision, communicates hidden state, or prevents a mistake.
- Remove redundant narration and concept repetition while preserving accessibility labels, unfamiliar-domain context, legal meaning, and error recovery.
- Make feedback reflect the real result. Preserve pending, failure, retry, and undo states instead of implying premature success.
- Use expression and motion to clarify interaction or acknowledge meaningful progress. Keep it subordinate to the task and support reduced motion.
- Preserve honest pricing, permissions, choices, and exits. Reject fabricated scarcity, concealed costs, obstructed cancellation, and pressure based on arbitrary rewards.
- Do not introduce emoji in UI copy unless requested.

## Apply the smallest useful change

For a material issue, connect observed friction to a design response and expected user benefit. Prefer task success, comprehension, recovery, and time saved over engagement alone.

Read [interaction patterns](references/interaction-patterns.md) when designing motion, progress, gamification, onboarding, or consequential choices. Use `laws-of-ux` only when a behavioral mechanism or named law could materially change the decision.

Match freedom to scope. Review-only requests produce recommendations. During authorized implementation, make routine reversible choices within the accepted direction and verify the affected interaction. Seek a decision only for unresolved changes to information architecture, legal meaning, commercial terms, or another consequential commitment.

## Finish

For a review, give the recommended screen direction and the material findings, each tied to evidence and a concrete correction. Include a validation signal for uncertain behavioral claims. Do not manufacture a fixed number of issues.

For implementation, report the changed behavior, inspected states, and material verification limits. Preserve essential information when evidence is insufficient to remove it.
