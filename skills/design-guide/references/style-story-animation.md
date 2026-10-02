# Story-driven animation

Use with the shared foundations. Animate a relationship that the user needs to understand. The narrative can be a short useful transformation rather than a cinematic opening.

## Character and fit

Useful for explaining a mechanism, workflow, cause-and-effect relationship or unfamiliar product. Suitable audience situations include learning, product evaluation and guided exploration. Motion itself is not evidence of engagement or understanding; assess whether the explanation improves.

Costs include sequencing, media weight, interruption/re-entry and a complete static equivalent. Repeated tasks usually need a brief state transition or optional explanation rather than the full introduction. Do not add a long story to a form whose value is already clear.

## Narrative and composition rules

- Write the explanation as a few meaningful states before designing movement: starting condition, relevant change and understandable result. Each beat needs an information purpose. Remove beats that merely repeat the same claim.
- Choose a persistent visual subject so users can track what changes. Preserve enough shape, position or colour continuity to connect before and after; do not morph unrelated objects without explanation.
- Specify the relation between text and scene. Keep an explanation stable while it is needed, and position it near the change it describes. Avoid simultaneous competing sequences or captions disappearing before they can be read.
- Select a pacing model: user steps, direct manipulation, native-scroll progress or a brief automatic transition. Justify the choice from the task. The user must be able to revisit information without replaying an unrelated introduction.
- Define the final state and onward action first. Do not make the call to action appear only at the end of a long compulsory sequence. A skip control does not repair missing information in the skipped result.
- Establish a visual grammar for location, layers and semantic colour. An object representing one concept should not silently change meaning between scenes. Camera movement must explain a relation rather than continually reorient the viewer.

## All six techniques

| Technique | Concrete application |
|---|---|
| Anchor typography | Choose a headline voice and stable explanation/caption roles. Set positions and measures that remain readable at pauses; do not animate the whole paragraph while the viewer tracks the scene. |
| Star of the show | Make the explanatory transformation or demonstration dominant. Name what the viewer should understand from its start and result, and identify the real action it supports. |
| Visual rhyming | Carry a recognisable object, connector, shape or transition rule through at least two beats and into a supporting UI element where useful. Continuity should preserve meaning, not merely colour. |
| Subtle depth | Use controlled planes, occlusion or shading to clarify structure. Keep nonessential parallax subordinate, and ensure depth order matches the relationship being explained. |
| Text opacity and emphasis | Emphasise the current explanation while retaining needed context. Inactive labels may be quieter but must be readable if still necessary; the complete explanation must also exist outside transient frames. |
| Design variations | Compare a sequential explanation with user-controlled exploration of the same information. Evaluate comprehension, time to action, revisit behaviour and static equivalence. |

## Components and state contract

Record a compact beat table: meaning, visual change, trigger, readable content, completion condition, interruption/re-entry and reduced-motion form. Use actual application events for progress; never manufacture a loading delay to accommodate the story. For a conceptual demonstration, label it as a demonstration rather than real processing.

Use native controls for steps, playback or direct manipulation, with keyboard alternatives and announced meaningful state where needed. Do not expose each animation frame to assistive technology. Keep the application state separate from decorative playback so cancellation or changing motion preferences does not corrupt a task.

Define what happens on rapid scrolling, resizing, navigating back and revisiting the page. Returning users should reach the task/result without compulsory replay. Respect context when remembering progress; do not invent storage requirements if a simple current-session state suffices.

## Mobile, reduced motion and delivery

On narrow screens, simplify the scene and sequence, not the explanation. Replace wide pinned scenes with stacked panels or explicit steps if needed. Sticky scenes must release naturally and never trap the page's scroll.

Reduced motion supplies a labelled diagram, ordered panels or immediate state changes containing the same relationships and outcome. Removing animation while leaving invisible layers is a failure. Provide a useful static fallback if scripts/media fail. Use media resolution and implementation complexity proportionate to the explanation; a few SVG states may be sufficient where a canvas or video was proposed.

## Failure patterns and review

| Reject | Verify instead |
|---|---|
| Visually impressive motion explains nothing new | Each beat has a distinct comprehension purpose |
| Playback delays real processing or invents progress | Progress follows actual events; demonstrations are labelled |
| Skipping removes information required for the task | The result/static path carries the whole explanation |
| Back, resize or reduced motion leaves a broken scene | State and content remain coherent under interruption |

Possible project rules: keep a named subject across the three selected states; bind the result to the real completion event; replace the scroll scene with ordered panels under reduced motion. Specify these in Layout and Components without creating a new product flow.
