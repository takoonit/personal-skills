# Neoskeuomorphism

Use with the shared foundations. Treat these defaults as candidates for the project's binding rules, not a compulsory visual preset.

## Character and fit

Build believable tactile relationships using light, material, edges and state. The point is to make an object or interaction understandable, not to emboss every rectangle. Neoskeuomorphism here includes contemporary physical cues; it does not mandate low-contrast neumorphism or glassmorphism.

Useful for sensory products, creative instruments and consumer tools where an object or control benefits from physicality. This is an audience-fit hypothesis, not evidence that a demographic prefers it. In a dense workspace, concentrate material expression around the main tool and keep surrounding data calm. Budget for asset creation and rendering; a product image on a plain canvas may communicate more than a full 3D scene.

## Composition, colour and material rules

- Declare one material family for each role: canvas, raised control, inset field and floating overlay. A material is a reusable treatment, not a new gradient per component. Start with few layers and add only a meaningful distinction.
- Choose one light direction and apply its highlight/shadow logic consistently to UI surfaces and the focal asset. Do not combine overhead-lit photography with strongly side-lit controls without an intentional separation.
- Use cast shadows for elevation, inset shading for recesses and borders/tonal contrast for boundaries. A selected state needs a semantic cue such as a mark or fill change; a tiny shadow change is insufficient.
- Define shape relationships between an outer shell and nested surfaces. Match curvature deliberately rather than applying the same radius to every nested rectangle. Preserve enough internal padding for the material edge and content to remain distinct.
- Keep the canvas quieter than the focal object. Reserve accent colour for a meaningful material detail or action. Separate action/status colours from reflected lighting.
- Use transparency only when seeing the underlying content is useful. Text-bearing glass needs a stable tint/backing and a no-blur fallback. Do not put competing transparent panels over changing video.

## All six techniques

| Technique | Concrete application |
|---|---|
| Anchor typography | Choose a display voice consistent with the product's material character; use dependable support type for measurements and labels. Avoid bevelled text and thin low-contrast labels. Define headline wrapping alongside the focal object's scale. |
| Star of the show | Choose the real product, meaningful model or main task control. Document its purpose, crop/orientation, surrounding clear space and interaction. Decorative knobs must not look usable when they are not. |
| Visual rhyming | Repeat a named edge detail, light direction or inset treatment in the focal object and at least two supporting locations, such as the primary control and media frame. Keep the same meaning across these applications. |
| Subtle depth | Map base, raised and floating roles to a small shadow/tonal system. Establish a ceiling: ordinary cards must not appear above dialogs or compete with the star. Blur is optional; layering is the actual decision. |
| Text opacity and emphasis | Define opaque or alpha text tokens on each material. Put secondary labels on a stable surface; measure the worst composited background. Keep form labels, value readouts and errors readable in every state. |
| Design variations | Compare object-led presentation with an instrument-panel arrangement using the same product/task. Judge control discovery, available working space and mobile legibility, not realism alone. |

## Components and interaction

Keep actual buttons, sliders and inputs semantic. Physical metaphors can supplement familiar controls but must not replace keyboard operation or an exact numeric input when precision matters. A knob may need arrows or direct value entry as an alternative to dragging.

Make focus a distinct ring/boundary independent of material highlights. Pressed feedback may reduce elevation without moving the hit target. Keep selected, disabled and loading meanings separate; do not label a control disabled merely because it is recessed. A modal can be materially distinct while its overlay and focus behaviour follow the incumbent system.

## Mobile, motion and delivery

Replace pointer tilt with a useful static angle on touch devices. Recompose the object and controls vertically where needed; never scale the entire desktop instrument down until labels become tiny. Keep the primary task visible without making everything fit a fixed viewport.

Use short state transitions only when they explain contact, movement or elevation. Do not make controls follow the cursor or simulate inertia that delays input. Reduced motion keeps the same resting materials and immediate state cues. Define image/static fallbacks for unavailable 3D and no-blur surfaces for unsupported or slow rendering. Profile large shadows and filters rather than assuming CSS is inexpensive.

## Failure patterns and review

| Reject | Verify instead |
|---|---|
| Embossed controls disappear into the canvas | Boundaries and focus remain visible with decorative shadows disabled |
| Each card has a different lighting/material recipe | A role-based surface map explains every exception |
| Expensive object hides the actual offer or tool | The static/mobile composition still explains value and permits action |
| Pressed and selected look identical | Persistent state is identifiable without watching a transition |

Possible project rules: keep one light direction; limit inset treatment to fields; render text-bearing overlays on a contrast-safe backing. Specialise these to real tokens/components and review the actual rendered result.
