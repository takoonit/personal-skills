---
name: laws-of-ux
description: "Diagnose behavioural UX friction in an existing or proposed interface or flow. Invoke when the decision depends on how people find, understand, choose, remember, learn, target, wait, recover, or judge an experience; for example confusing navigation, too many hard-to-compare choices, recall-heavy multi-step flows, unfamiliar controls, misclicks, weak grouping, ambiguous feedback, progress pressure, or rough endings. Also invoke when someone explicitly cites a UX law and its applicability needs checking. Do not invoke merely because a task mentions UX/UI, visual styling, layout polish, accessibility compliance, design systems, copywriting, implementation, or generic best practices. Use observed evidence first, treat laws as hypotheses with confidence levels, select at most three non-duplicative mechanisms, expose conflicts and ethical risk, recommend the smallest testable correction, and define a falsifiable validation signal."
---

# Laws of UX

Use behavioural laws as **candidate explanations**, not commandments. Diagnose the task and friction first. Name a law only when it sharpens the mechanism or changes the correction.

A good run should make the interface easier to reason about even if every law name is removed afterwards.

## Trigger gate

Before doing anything else, decide whether this skill should own the task.

### Trigger when at least one behavioural question is material

- **Find:** can users locate the right thing or distinguish it from noise?
- **Understand:** can they predict meaning, state, or consequence?
- **Decide:** are choices hard to compare, prioritise, or commit to?
- **Act:** is a control difficult to acquire, ambiguous, error-prone, or easy to trigger accidentally?
- **Remember:** must users retain information the product could keep visible?
- **Learn:** does an unfamiliar interaction or concept need to become usable quickly?
- **Wait:** does latency or uncertain system status interrupt attention or trust?
- **Recover:** can users safely undo, retry, resume, or escape an error?
- **Finish:** does confirmation, failure, or the ending distort the remembered experience?

Also trigger when the user or another agent explicitly invokes Hick, Fitts, Miller, Jakob, Peak-End, Gestalt grouping, cognitive load, choice overload, or another behavioural principle and the claim needs validation.

### Do not trigger for adjacent work with no behavioural uncertainty

Route away when the task is primarily:

- visual styling, branding, colour palette, typography, or aesthetic direction;
- component implementation or refactoring with accepted UX behaviour;
- design-system consistency or token work;
- accessibility conformance or assistive-technology testing as the primary question;
- copywriting with no behavioural design decision;
- analytics reporting with no UX hypothesis;
- generic "make this UI better" work where the actual need is expressive interaction design rather than behavioural diagnosis.

Use `$intentional-design` for expressive task-first UI, feedback, state, hierarchy, and interaction character. Use `$doakes` when a requested design drifts from the product's core outcome. Hand accepted implementation requirements to `$ship-sound-code`.

If uncertain, ask one silent routing question: **Would a behavioural mechanism change the design decision?** If no, do not invoke this skill.

## Evidence outranks law names

Use `references/evidence-strength.md` for evidence grading and limitations.

Never present a law as proof by itself. Every material finding needs:

1. **Observation:** what is seen or measured;
2. **Mechanism:** why a behavioural effect plausibly explains it;
3. **Correction:** the smallest intervention that addresses that mechanism;
4. **Collision:** a competing need, law, accessibility constraint, or cost;
5. **Validation:** a result that could support or falsify the recommendation.

Use this compact chain:

`Observation -> mechanism [confidence] -> smallest correction -> collision/cost -> validation.`

If observation or context is missing, mark the finding as a **hypothesis**, not a diagnosis.

## Grade confidence

Attach one confidence label to each selected mechanism:

- **High:** directly observed task evidence plus a well-established mechanism that matches this context.
- **Moderate:** mechanism is well established, but context transfer or causal evidence is incomplete.
- **Low:** useful heuristic, weakly specified effect, indirect evidence, or a named UX "law" with limited direct support.

Confidence describes the **claim in this context**, not the prestige of the law. A famous law can still be Low confidence for a specific screen.

Never turn a rough empirical tendency into a hard interface constant. In particular:

- Miller's 7±2 is not a menu-item limit; later work commonly places focal working-memory capacity nearer three to five chunks under constrained conditions.
- Doherty's 400 ms figure is not a universal latency SLA; optimise acknowledgement and perceived continuity according to task and system constraints.
- Fitts predicts target acquisition under a movement model; it does not say every important control should dominate the screen.
- Hick/Hyman-style choice-time effects do not justify hiding meaningful alternatives or collapsing expert workflows into one path.

## Frame the task

State the smallest useful frame:

`For <user>, in <context>, complete <task> while <constraint>.`

Record the evidence source: direct research, usability observation, support issue, analytics, screenshot, prototype, recording, implementation, or user report. Separate fact from inference.

When appearance or interaction matters, inspect the rendered product, prototype, screenshot, or recording. Do not claim visual evidence from component names or markup alone.

## Select mechanisms, then laws

Classify the dominant friction first. Then select **one to three non-duplicative mechanisms**. Use `references/law-catalogue.md` as a routing index, not a checklist.

Prefer mechanisms that imply different corrective actions. Do not stack Cognitive Load, Working Memory, Miller's Law, and Chunking just because they sound mutually reinforcing.

Quick routes:

| Friction | Candidate mechanisms |
| --- | --- |
| Find / scan | selective attention, proximity, similarity, common region, connectedness, distinctiveness |
| Understand / remember | working memory, cognitive load, mental model, chunking, familiarity |
| Decide | choice complexity, comparison cost, defaults, serial position |
| Act | target acquisition, motor accessibility, immediate acknowledgement |
| Learn | familiarity, learn-by-doing, contextual guidance, mental model |
| Wait | acknowledgement, honest status, continuity of attention |
| Progress | goal proximity, unfinished-task salience, flow |
| Recover | state preservation, error tolerance, reversible action |
| Finish / recall | peak-end weighting, serial position, outcome clarity |

Use named laws only after the mechanism is clear.

## Resolve collisions before recommending

### Familiarity versus novelty

Keep commodity actions recognisable. Novelty is justified only when it materially improves the task, unlocks a capability, or creates deliberate exploration worth the learning cost.

### Fewer choices versus discoverability

Reducing decision cost can mean grouping, sequencing, recommending, filtering, search, or safe defaults. Do not simply hide options and call the result "simpler".

### Simplicity versus conserved complexity

Remove accidental complexity, but do not hide consequential state or choices. Move repeatable work into sensible defaults and automation while retaining user control.

### Speed versus truth

Fast acknowledgement is useful. False completion is not. Optimistic UI must reconcile with the server and expose pending, failure, reversal, and retry states honestly.

### Progress versus pressure

Progress indicators may support a user-chosen goal. Reject fake urgency, artificial incompleteness, streak anxiety, forced continuity, and progress theatre used mainly to increase engagement.

### Aesthetics versus usability

Visual coherence can improve perceived ease and trust, but it cannot override observed task failure, accessibility barriers, or unclear recovery.

### Tolerance versus security

Human input may accept harmless formatting variation. Protocols, money, permissions, identity, storage, and security boundaries require explicit validation and canonicalisation.

## Accessibility and ethics are hard constraints

Accessibility, safety, informed consent, legal obligations, privacy, data integrity, and truthful system status outrank behavioural heuristics.

At minimum, do not let a UX-law recommendation weaken:

- keyboard and assistive-technology operation;
- visible and programmatic focus/state;
- readable labels and error association;
- reduced-motion or input-modality support;
- adequate target size and spacing;
- honest status messaging;
- reversible or informed consequential choices.

Do not exploit behavioural effects to steer users against their interests. Reject hidden fees, false urgency, disguised advertising, confirm-shaming, obstructed cancellation, forced disclosure, misleading defaults, or visual interference designed to suppress a legitimate choice.

## Prefer the smallest intervention

Start with the least disruptive correction that addresses the mechanism:

- preserve context instead of testing memory;
- group semantically related content;
- separate unrelated controls;
- improve labels, hierarchy, spacing, hit area, or control placement;
- prioritise or filter choices without removing legitimate access;
- reveal unfamiliar guidance when it becomes relevant;
- reuse known information through safe defaults or prefill;
- acknowledge actions immediately and show honest progress;
- add undo, retry, resume, or a clear recovery path;
- clarify confirmation and the next useful action.

Escalate to navigation or information-architecture redesign only when smaller corrections cannot resolve the observed friction.

## Validate the mechanism, not just the metric

Choose a signal aligned to the friction:

| Friction | Useful validation |
| --- | --- |
| Find | time to first correct action, wrong-path rate, search reformulation |
| Understand | comprehension, consequence prediction, error rate |
| Decide | decision time, comparison success, abandonment, justified confidence |
| Act | task completion, misclicks, repeat submissions, recovery success |
| Wait | duplicate actions, abandonment, perceived wait, trust in status |
| Remember | backtracking, memory errors, copy/paste workarounds |
| Learn | time to first value, independent success, contextual-help use |
| Recover | successful retry, preserved data, support contacts |
| Finish | outcome clarity, next-step success, later recall |

Conversion, engagement, retention, or time spent alone do not demonstrate better UX. Pair business outcomes with task success, comprehension, error, recovery, and user control.

## Reject cargo-cult reasoning

Do not:

- cap menus or navigation at seven because of Miller;
- remove necessary choices merely to cite Hick;
- make every primary action enormous because of Fitts;
- treat 400 ms as a universal performance threshold;
- hide core features behind progressive disclosure only to make a screen look clean;
- use polished visuals to dismiss usability faults;
- cite Gestalt principles to justify arbitrary cardification;
- add delight before fixing error recovery;
- use fake progress, streak loss, fabricated scarcity, or unfinished-task anxiety;
- use Postel loosely at trust or security boundaries;
- output a parade of law names with no prioritised decision.

## Report decisively

Default output:

**Verdict:** clear, friction, risk, or evidence gap.

**Task:** framed user task and context.

**Evidence:** observed facts versus inference.

Then no more than three findings:

`<Mechanism / law> [confidence] - <observation>; <why it matters>; <smallest correction>; <collision/cost>; <validation>.`

Add one short **Counterpoint** only if a reasonable alternative could change the decision.

End with **Direction:** the leanest viable changes in priority order. If the behaviour is accepted and the task is implementation-ready, hand explicit states, constraints, and acceptance checks to `$ship-sound-code`.