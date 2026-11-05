# Interaction Guidelines

Use this reference after the task path or primary loop and interaction contracts are known. It supplies implementation and review guidance; it does not replace the task model.

## System status and recovery

| Persistent state | Design response |
|---|---|
| Pending | Show what is processing and preserve context. Never simulate progress. |
| Ready for input | Expose the next action through affordance and state, not an instruction wall. |
| Completed | Make the resulting state stable and clear; acknowledge it without forced celebration. |
| Invalid input | Reveal constraints while the user works when practical. |
| Error | Identify the affected state, give the smallest correction, and retain valid work. |
| Undoable result | Make reversible actions easy to reverse while the context remains fresh. |

## Progressive disclosure

Use the sequence: orient → act → respond → reveal → recover or continue.

For complex tools, expose the first valuable action rather than the full feature set. Reveal the next layer only when it advances the user’s job or understanding. Do not hide safety, price, permission, or irreversible consequences.

For learning and visualisation products, prefer selecting, comparing, tracing, arranging, or transforming the real domain object. The resulting change should demonstrate the concept before text explains it.

## Motion and sensory feedback

Choose feedback after the state transition is defined.

- Use motion to preserve spatial continuity, show a relationship, expose state, or acknowledge a direct action.
- Make feedback responsive to input where applicable; avoid disconnected spinners and canned flourishes.
- Keep routine feedback brief and interruptible. For direct input, aim to acknowledge within about 100 ms; routine transitions usually take 150–300 ms. Adapt to platform conventions, visual distance, and accessibility rather than treating these as deadlines. For slower work, show truthful pending status promptly and completion only when confirmed.
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

## Neutral example: comparing delivery plans

Task: A coordinator compares two delivery plans to choose one that meets a deadline.

| Trigger | Rule | Feedback | Persistent state / recovery |
|---|---|---|---|
| Adjust departure time | Recalculate arrival using disclosed assumptions | Acknowledge immediately; show affected times pending until confirmed | Updated plan; edit again or undo to the previous time |
| Select a plan | Make it the active comparison | Highlight its route and arrival against the deadline | Persistent selection; choose another or clear selection |
| Save chosen plan | Persist the selection | Confirm only after success; retain input on failure | Saved plan; edit or retry on failure. If dispatch prevents reversal, disclose that consequence before confirmation |
