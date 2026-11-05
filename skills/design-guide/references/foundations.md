# Shared design foundations

Use these with the selected style guide. The guides supply defaults; the project contract supplies binding choices. Accessibility requirements and explicit constraints cannot be waived by a stylistic preference. This checklist alone does not prove WCAG conformance.

## Type and content

- Set roles before font names: display, heading, body, label and caption. Start with the incumbent family; introduce another only for a clear role or script need. Avoid unrelated display voices.
- Use real headlines, long labels, prices and error messages when judging scale. Responsive typography needs minimum/maximum sizes and content-driven wrapping, not viewport units alone. Essential words must not be clipped for composition.
- For Latin prose, a measure around 45–75 characters and body line height around 1.5 can be useful starting points. These are adjustable heuristics, not accessibility thresholds. Test the actual typeface and language; do not transfer a Latin `ch` measure or tight display leading mechanically to Thai.
- Check Thai combining marks, mixed Thai/Latin baselines, numbers, punctuation and real wrapping when relevant. Do not add Latin-style tracking to every script or split text into code units for animation. Keep essential copy as selectable, accessible text.
- Define font fallbacks and check layout before webfonts load. Reserve space for predictable changes; avoid hiding the message during loading.

## Colour, emphasis and depth

- Map semantic roles for canvas, surface, text, supporting text, borders, accent and status. The brand accent cannot represent every status. Pair colour with text/icon/state cues where meaning matters.
- Apply the opacity technique as readable levels of emphasis, not fixed alpha percentages. Measure the final foreground/background combination. A lighter opaque semantic colour is often more predictable than fading a parent container.
- For WCAG 2.2 AA, normal text generally needs 4.5:1 contrast; qualifying large text needs 3:1. Large text means at least 18pt regular or 14pt bold, approximately 24px or 18.7px in CSS; account for the criterion's exceptions. Necessary component/state graphics generally need 3:1 against adjacent colours under the non-text criterion. Check the applicable rule, not every decorative line.
- On imagery, glass and gradients, check the least favourable area behind text, including changed crops/states. Add a stable backing if contrast cannot be guaranteed. A shadow or text outline is not automatic proof.
- Choose a layer order and one depth grammar. Give overlays, menus and focus indicators explicit stacking behaviour; decorative layers must not intercept input. Keep texture away from reading surfaces unless legibility is verified.

## Layout, controls and states

- Use content-driven breakpoints, consistent spacing roles and logical document order. Define a visible priority, not merely a large object. The main task area may be the star on a dense working screen.
- Preserve labels, native semantics and expected link/button behaviour. Provide relevant hover, focus-visible, pressed, selected, disabled, loading, error and success states. Hover must not be the only route to information or action.
- Support keyboard access and visible, unobscured focus. WCAG 2.2 AA pointer targets use 24 by 24 CSS pixels or specified exceptions; a 44px comfort target is a useful project choice, not the AA minimum. Retain stronger existing requirements.
- Check ordinary content reflow at 320 CSS pixels wide, text enlargement to 200%, and relevant zoom conditions. Content needing two-dimensional layout has specific exceptions; handle wide tables locally rather than overflowing the whole page. Do not shrink text to evade reflow.
- Test long content and content absence. Define empty, broken-image and unavailable-asset treatments without invented data, testimonials or provenance. A fixed-height hero must not be necessary to understand the product.

## Motion and delivery

- Document each motion's purpose, trigger, element/property, pacing, final state, interruption/replay and reduced-motion equivalent. Reuse motion tokens. If none exist, propose a small set and validate it in context; there is no universal premium duration.
- Provide meaningful static content first. Do not leave content invisible when animation is disabled or fails. Reduced motion may need a different composition, not merely faster movement. Tie progress and state truth to real processing.
- Keep native scrolling. Avoid scroll hijacking, forced cursor replacement and interaction delays. Automatically moving content lasting more than five seconds alongside other content needs pause/stop/hide under the applicable WCAG rule, unless essential. Auto-updating content has a separate control requirement without that five-second condition.
- Honour reduced-motion preferences as a skill design requirement. WCAG's specific Animation from Interactions criterion is AAA; do not mislabel it AA. Avoid flashing treatments rather than designing to a threshold.
- Prefer transform/opacity for decorative animation when suitable; they do not guarantee smoothness. Profile representative hardware. Large blur, filters, canvases and many layers can be costly. Do not prescribe a library or GPU-heavy implementation from a style name.
- Reserve media dimensions, use appropriately sized assets and defer non-critical effects. Agree performance budgets from actual device/network constraints; do not invent measurements or claim speed from source code alone.

## Sources and status

Checked 2026-10-02. Numeric accessibility statements refer to these primary sources. Style recipes elsewhere are editorial guidance, not W3C requirements. Recheck sources when changing standards claims.

- [Contrast minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) and [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).
- [Target size minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), [reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) and [resize text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html).
- [Pause, stop, hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) and [animation from interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html).
- [High-performance CSS animations](https://web.dev/articles/animations-guide) and [reduced motion](https://web.dev/articles/prefers-reduced-motion).
