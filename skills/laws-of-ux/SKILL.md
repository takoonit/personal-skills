---
name: laws-of-ux
description: "Diagnose behavioural UX friction when a design decision depends on how people find, understand, choose, remember, learn, target, wait, recover, or judge an experience. Trigger for confusing navigation, hard-to-compare choices, recall-heavy flows, unfamiliar controls, misclicks, weak grouping, ambiguous feedback, progress pressure, rough endings, or when a named UX law needs validation. Do not trigger for styling, branding, design-system work, implementation-only tasks, generic accessibility compliance, copywriting, or broad UI polish unless a behavioural mechanism could materially change the decision. Use evidence first, select at most three non-duplicative mechanisms, grade confidence, expose conflicts and ethical constraints, and recommend the smallest falsifiable correction."
---

# Laws of UX

Use behavioural laws as candidate explanations, not commandments.

The skill succeeds when it makes the design decision clearer even if every law name is removed afterwards.

## Ownership gate

Own the task only when a behavioural mechanism could materially change the design decision.

Canonical friction classes:

- **Find** — locate, notice, distinguish, scan.
- **Understand** — interpret meaning, state, hierarchy, or consequence.
- **Decide** — compare, prioritise, choose, commit.
- **Act** — acquire, trigger, avoid accidental action.
- **Remember** — retain information the product could keep visible.
- **Learn** — understand an unfamiliar control, concept, or workflow.
- **Wait** — maintain attention and trust during latency or uncertain status.
- **Recover** — undo, retry, resume, escape, preserve state.
- **Finish** — understand outcome, confirmation, next step, or remembered ending.

Also own the task when a user or another agent explicitly cites a behavioural UX law and its applicability needs checking.

Do not own pure visual styling, branding, colour, typography, design-system consistency, accepted implementation, accessibility conformance as the primary task, copywriting, or generic UI polish.

Routing test: **If identifying a behavioural mechanism would not change the design decision, do not invoke this skill.**

Use `$intentional-design` for expressive task-first UI, hierarchy, feedback, state, and interaction character. Use `$doakes` for product-direction drift. Hand accepted implementation to `$ship-sound-code`.

## Reasoning procedure

Run this sequence once. Do not expand it unless the task is genuinely complex.

1. **Frame** — `For <user>, in <context>, complete <task> while <constraint>.`
2. **Observe** — separate visible/measured facts from inference.
3. **Classify** — choose the dominant friction class above.
4. **Explain** — identify one to three non-duplicative behavioural mechanisms.
5. **Grade** — High, Moderate, or Low confidence using `references/evidence-strength.md`.
6. **Correct** — propose the smallest intervention that addresses the mechanism.
7. **Challenge** — check collisions, accessibility, ethics, and business constraints.
8. **Validate** — state what result would support or falsify the recommendation.

Use this compact chain for each material finding:

`Observation -> mechanism [confidence] -> smallest correction -> collision/cost -> validation.`

If evidence is missing, label the finding **hypothesis**, not diagnosis.

## Evidence rules

Evidence outranks law names.

Prefer, in order:

1. direct task evidence from usability observation, support failures, recordings, experiments, or reliable telemetry;
2. established behavioural mechanisms that transfer well to the target context;
3. applied UX heuristics;
4. aphorisms or weakly specified rules.

A famous law can still be Low confidence for a specific screen.

Never turn rough empirical tendencies into hard interface constants. In particular:

- Miller's 7±2 is not a menu-item limit;
- 400 ms is not a universal latency SLA;
- Fitts does not mean every important control should dominate the screen;
- Hick-style effects do not justify hiding meaningful alternatives;
- Pareto is not an exact 80/20 acceptance criterion.

## Mechanism routing

Use `references/law-catalogue.md` as an index, not a checklist.

| Friction | Candidate mechanisms |
| --- | --- |
| Find | selective attention, proximity, similarity, common region, connectedness, distinctiveness |
| Understand | mental model, cognitive load, chunking, grouping, familiarity |
| Decide | choice complexity, comparison cost, defaults, serial position |
| Act | target acquisition, motor accessibility, accidental activation, immediate acknowledgement |
| Remember | working memory, externalised state, chunking, recognition over recall |
| Learn | familiarity, learn-by-doing, contextual guidance, mental model |
| Wait | acknowledgement, honest status, continuity of attention |
| Recover | state preservation, reversible action, error tolerance |
| Finish | outcome clarity, peak-end weighting, serial position, next-step orientation |

Select mechanisms that imply different corrective actions. Do not stack near-synonyms merely to strengthen rhetoric.

## Collision checks

Resolve these before recommending:

- **Familiarity vs novelty:** preserve familiar commodity actions; spend novelty only where the learning cost buys material value.
- **Fewer choices vs discoverability:** group, sequence, recommend, filter, search, or default before hiding options.
- **Simplicity vs conserved complexity:** remove accidental complexity, not consequential state or control.
- **Speed vs truth:** acknowledge quickly, but never fake completion or hide pending/failure states.
- **Progress vs pressure:** support user-chosen goals; reject fake urgency, streak anxiety, artificial incompleteness, and progress theatre.
- **Aesthetics vs usability:** visual polish cannot override observed task failure or accessibility barriers.
- **Tolerance vs security:** harmless human-input variation is different from permissive handling at money, identity, permission, protocol, or storage boundaries.

## Hard constraints

Accessibility, safety, informed consent, legal obligations, privacy, data integrity, and truthful system status outrank behavioural heuristics.

Do not weaken:

- keyboard or assistive-technology operation;
- visible and programmatic focus/state;
- readable labels and error association;
- reduced-motion or alternate-input support;
- adequate target size and spacing;
- honest status messaging;
- reversible or informed consequential choices.

Reject any recommendation whose success depends on making a legitimate alternative harder to notice, understand, choose, undo, or leave.

Examples: false urgency, hidden fees, confirm-shaming, obstructed cancellation, misleading defaults, forced disclosure, disguised advertising, or visual interference that suppresses a legitimate choice.

## Smallest-intervention bias

Prefer, in order:

1. preserve context;
2. improve grouping or separation;
3. improve label, hierarchy, spacing, hit area, or placement;
4. prioritise/filter choices while preserving access;
5. add contextual guidance;
6. reuse known information through a safe default or prefill;
7. improve acknowledgement and honest status;
8. add undo, retry, resume, or recovery;
9. clarify confirmation and next action;
10. redesign navigation or information architecture only if smaller corrections fail.

## Validation

Match evidence to the friction:

| Friction | Useful validation |
| --- | --- |
| Find | time to first correct action, wrong-path rate, search reformulation |
| Understand | comprehension, consequence prediction, error rate |
| Decide | decision time, comparison success, abandonment, justified confidence |
| Act | task completion, misclicks, repeated actions, accidental activation |
| Remember | backtracking, memory errors, copy/paste workarounds |
| Learn | time to first value, independent success, contextual-help use |
| Wait | duplicate actions, abandonment, perceived wait, trust in status |
| Recover | successful retry, preserved data, support contacts |
| Finish | outcome clarity, next-step success, later recall |

Conversion, engagement, retention, and time spent are secondary unless paired with task success, comprehension, recovery, and user control.

## Output contract

Default to a compact result:

**Verdict:** clear, friction, risk, or evidence gap.

**Task:** framed task and context.

**Evidence:** observed facts versus inference.

Then at most three findings:

`<Mechanism / law> [confidence] - <observation>; <why it matters>; <smallest correction>; <collision/cost>; <validation>.`

Add one short **Counterpoint** only if it could materially change the decision.

End with **Direction:** the leanest viable changes in priority order.

Do not output a catalogue of laws, generic UX advice, or extended theory unless explicitly asked.
