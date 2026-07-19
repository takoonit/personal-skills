# Interaction Guidelines

Use this reference after the primary loop and interaction contracts are known. It supplies implementation and review guidance; it does not replace the loop.

## System status and recovery

| State | Design response |
|---|---|
| Pending | Show what is processing and preserve context. Never simulate progress. |
| Ready for input | Expose the next action through affordance and state, not an instruction wall. |
| Success | Make the resulting state stable and clear; acknowledge it without forced celebration. |
| Validation | Reveal constraints while the user works when practical. |
| Error | Identify the affected state, give the smallest correction, and retain valid work. |
| Undo | Make reversible actions easy to reverse while the context remains fresh. |

## Progressive disclosure

Use the sequence: orient → act → respond → reveal → recover or continue.

For complex tools, expose the first valuable action rather than the full feature set. Reveal the next layer only when it advances the user’s job or understanding. Do not hide safety, price, permission, or irreversible consequences.

For learning and visualisation products, prefer selecting, comparing, tracing, arranging, or transforming the real domain object. The resulting change should demonstrate the concept before text explains it.

## Motion and sensory feedback

Choose feedback after the state transition is defined.

- Use motion to preserve spatial continuity, show a relationship, expose state, or acknowledge a direct action.
- Make feedback responsive to input where applicable; avoid disconnected spinners and canned flourishes.
- Keep routine feedback brief and interruptible. Use platform conventions and visual distance instead of a single timing rule.
- Use haptics or sound only when supported, not disabled, and distinct from visual feedback.
- Reserve richer feedback for rare, user-valued milestones. Keep it skippable and never block the next task.
- Respect `prefers-reduced-motion` and equivalent settings. Preserve the final state, hierarchy, status, and recovery route without motion.
- Never make motion, colour, sound, or haptics the only carrier of consequential information.

## Interaction tone

State a concrete interaction tone—such as precise, calm, playful, ceremonial, reassuring, or energetic—before choosing feedback.

Match it to the domain’s trust level. Serious financial, medical, legal, and operational tools can feel responsive and satisfying without comic rewards, forced excitement, or variable-reward pressure. Playful products may use more expressive feedback when user control remains clear.

Build one recognisable sequence: resting state → response → resolved state. Do not stack scale, glow, sound, haptic, confetti, copy, and counter changes around one event.

## Failure patterns

- **Ghost action:** an action has no visible acknowledgement.
- **Animation theatre:** motion has no state, relationship, or user benefit behind it.
- **Static explainer:** the product uses panels and copy where a user could manipulate the real model.
- **Premature complexity:** the interface exposes every feature before the first job is understood.
- **Punishing loop:** streak loss, false urgency, variable rewards, or notification pressure manufacture dependence.
- **Tone break:** feedback undermines the task’s emotional or trust context.

## Bazi mapping example

Primary loop: `A learner adjusts or inspects one birth-data-derived chart object to understand how it produces the next chart relationship.`

| Trigger | Rule | Feedback | Mode / recovery |
|---|---|---|---|
| Adjust birth time | Recalculate the hour boundary using disclosed assumptions | Show the affected time range and pillar resolve from pending to final | Keep the previous result available; edit time or location |
| Select a pillar character | Make it the active chart object | Reveal its stem/branch, element, and plain-language role | Persistent selection; select another or clear focus |
| Trace an element to the Day Master | Compute the relation from the selected object to the reference point | Draw the relationship and name one consequence | Persistent relation; select another object or return to overview |
