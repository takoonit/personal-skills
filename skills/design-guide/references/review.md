# Make the contract usable later

## Agent instruction block

Place one block in the applicable existing project instruction file; substitute real relative paths. Create a small project-scoped AGENTS.md only if none exists. Update this block idempotently; preserve unrelated instructions and broader policy.

```markdown
<!-- design-guide:start -->
## Design Guide
Before UI changes, read [the design system](DESIGN.md) and [the guardrails](DESIGN-GUARDRAILS.md).
Apply Design Guide whenever work affects visual design or user experience, including routine implementation and fixes.
Reuse their tokens and components; preserve the binding style rules and all six technique decisions.
Check only the affected rules/states for routine edits; do not restart style selection or generate documents unnecessarily. Report failures or unverified checks.
Record intentional system changes in both files; do not rewrite rules to excuse drift.
<!-- design-guide:end -->
```

If integration is prohibited or unavailable, provide the snippet and say it is not wired. Markdown does not install CI or guarantee that every agent follows it.

## Before building

Read both documents, scoped target and code. Name reused tokens/components, binding style rules and expected focal element. Resolve direct instruction conflicts before dependent work. A local edit does not reopen whole-site direction. Review against the actual contract; profile defaults are diagnostic guidance, not retroactive requirements for an incumbent system.

If design documents do not exist for a small ongoing change, use coherent nearby components/tokens as scoped evidence and record uncertainty briefly. Do not force contract generation, a style label or new variations before completing the fix. If a broader direction genuinely needs to be established, use the full workflow for that scope. In other media, review the equivalent visual authority and medium-specific behaviour with the specialist skill.

## Evidence gate

| Check | Evidence for a pass |
|---|---|
| Style/scope | Each applicable binding style rule has evidence; output retains selected character and scope. |
| Typography | Correct roles/fonts, readable fallback, required scripts and wrapping. |
| Star | Clear first focal element serves the action/meaning and adapts to mobile. |
| Rhyming | Named motif recurs in specified places without arbitrary variants. |
| Depth | Chosen layering appears where specified, preserving legibility; a documented incumbent absence remains unchanged until adoption is authorised. |
| Text emphasis | Levels are distinct; actual composited contrast is checked. |
| Variations | Selected composition is followed; advisory options remain advisory. |
| Reuse | Code uses mapped tokens/components; exceptions are explained. |
| Interaction | Applicable loading, empty, error, disabled, selected and success states work. |
| Access/delivery | Keyboard/focus, responsive behaviour, reduced motion and relevant project checks work. |

Use the selected style guide's failure patterns to focus inspection. For material-led UI, inspect consistent lighting/boundaries and no-blur fallback; for kinetic type, inspect the resting message and real script shaping; for minimalism, inspect retained labels and identity; for editorial, inspect reading/caption order; for story animation, inspect interruption and equivalent static explanation; for human-made, inspect asset provenance/crops; for expressive, inspect coherent visual grammar and control clarity. These checks are conditional on the project's selected rules and scope.

Use the existing accessibility target. If absent, propose WCAG 2.2 AA as the baseline and verify applicable criteria using the shared foundations. Reduced-motion support is also a skill requirement; do not mislabel the AAA Animation from Interactions criterion as AA. Essential content/actions must not depend on motion, hover or powerful hardware.

Inspect representative desktop and narrow/mobile surfaces in one batch when runnable. Reuse tools/tests rather than installing a new harness. Code review can verify token usage but cannot certify rendered legibility or task usability.

Report material issues as rule, evidence, consequence, smallest correction. Distinguish pass, fail and unverified. For documentation runs, check documents and leave runtime implementation unverified.

If fixes are requested, apply a scoped batch and confirm once. Record larger redesign needs without expanding scope. Stop when the agreed outcome is reviewable.
