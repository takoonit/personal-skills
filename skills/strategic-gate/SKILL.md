---
name: strategic-gate
description: "Decide whether a proposed piece of work deserves attention now before planning or execution. Use when several plausible initiatives compete, a request may be solution-first, evidence is weak, priorities are unclear, or AI is likely to execute the wrong thing efficiently. Separate facts from assumptions, compare alternatives, choose one Now/Next/Later direction, then route accepted work to the appropriate specialist skill. Do not use for already accepted, well-scoped implementation work."
---

# Strategic Gate

Choose the battle before choosing the weapon. Decide whether work should happen now, later, differently, or not at all. This is a decision gate, not an implementation planner.

## Coexist with other skills

Use this skill above specialised planning and execution skills. Do not duplicate their work.

- Route unresolved product or system design to `$shape-system-work` after this gate establishes that it deserves attention now.
- Route clear implementation to `$ship-sound-code`.
- Use `$doakes` when a request conflicts with established project intent or appears to introduce drift.
- Leave specialised domain decisions to an active narrower skill once the strategic priority is settled.

If an accepted decision already establishes priority, outcome, and evidence, do not reopen it without new contradictory evidence.

## Run the gate

Start from the requested action, but do not assume the action is the real need. Establish:

1. **Intent:** What outcome is actually wanted, for whom, and why now?
2. **Evidence:** What is observed or validated rather than merely believed?
3. **Assumptions:** What must be true for the proposed work to matter?
4. **Alternatives:** What smaller, cheaper, reversible, or non-build path could achieve the outcome?
5. **Trade-offs:** What does choosing this consume, delay, complicate, or lock in?
6. **Decision:** Do it now, defer it, replace it with another move, or reject it.

Ask only questions whose answers could change the decision. Otherwise state the uncertainty explicitly and proceed with a reversible assumption.

## Keep facts and assumptions separate

Label consequential claims as one of:

- **Fact:** supported by direct evidence, accepted project state, measured behaviour, or an explicit constraint.
- **Assumption:** plausible but unvalidated.
- **Unknown:** important information that cannot currently be inferred safely.

Never let repeated assumptions harden into facts. For the weakest important assumption, name the cheapest test that could disprove it.

## Compare no more than three moves

When alternatives matter, compare at most:

- **Baseline:** do nothing or make the smallest viable move.
- **Recommended:** the best present move.
- **Scale path:** only when future scale materially changes today's choice.

Judge them by outcome leverage, evidence strength, reversibility, time/cost, opportunity cost, maintenance burden, and risk. Prefer the option that buys the most useful evidence or outcome for the least irreversible commitment.

Do not reward novelty, technical elegance, or apparent completeness unless they improve the actual outcome.

## Force a Now / Next / Later decision

End prioritisation with exactly one **Now** item.

- **Now:** the single highest-leverage move or experiment.
- **Next:** what becomes worth doing if Now succeeds or resolves its uncertainty.
- **Later:** tempting work deliberately frozen because it does not yet earn attention.

If nothing has enough evidence or leverage to justify execution, Now may be a validation experiment rather than a build task.

State what must *not* be worked on yet. This is part of the decision, not an optional footnote.

## Hand off, do not implement

Once the gate passes, emit a compact hand-off:

- **Decision:** chosen move and why it wins now.
- **Outcome:** observable result that would make the move successful.
- **Evidence:** facts supporting the decision.
- **Assumptions:** remaining bets and the weakest assumption.
- **Constraints:** important limits and accepted trade-offs.
- **Non-goals:** work explicitly frozen.
- **Revisit trigger:** evidence or condition that should reopen the decision.
- **Route:** the skill or owner that should take the next step.

Do not design architecture, write implementation tasks, edit code, or perform the specialist's job. `$shape-system-work` may turn an accepted product/system direction into a delivery brief; `$ship-sound-code` may execute an already defined change.

## Use an adversarial check

Before finalising, challenge the preferred move once:

- What evidence would make this decision wrong?
- Are we solving a symptom because the proposed solution is attractive?
- Is there a cheaper way to learn the same thing?
- What valuable work gets displaced if we choose this?
- Are we creating a commitment before uncertainty requires it?

A strong challenge may change the recommendation. Do not manufacture opposition when the evidence is already decisive.

## Respond efficiently

Return:

1. **Gate verdict:** `NOW`, `DEFER`, `REPLACE`, or `REJECT`, with one-sentence reasoning.
2. **Facts / assumptions:** only the consequential items.
3. **Decision:** recommended move and accepted trade-off.
4. **Now / Next / Later:** exactly one Now item.
5. **Leverage / trap:** the highest-value hidden advantage and the main hidden cost or failure mode.
6. **Hand-off:** next skill or owner, success evidence, and revisit trigger.

Keep the response compact unless the decision is consequential or the user asks for depth.
