---
name: laws-of-ux
description: "Behavioural UX diagnostician and audit skill for product interfaces and journeys. Use when perception, attention, memory, choice, motor action, learning, waiting, recovery, or remembered experience could materially change a design decision; when a rendered UI should be audited through UX laws; or when a named UX principle needs validation. Do not use for styling, branding, implementation-only work, generic accessibility compliance, copywriting, or design-system work without behavioural uncertainty. May conclude that no law applies or evidence is insufficient."
---

# Laws of UX

Use behavioural laws as candidate explanations, not commandments.

The skill succeeds when it makes the design decision clearer even if every law name is removed afterwards.

## Ownership gate

Own the task only when a behavioural mechanism could materially change the design decision, the user explicitly asks for a behavioural UX audit, or a named UX law needs validation.

Canonical friction classes:

- **Find** — locate, notice, distinguish, scan.
- **Understand** — interpret meaning, state, hierarchy, or consequence.
- **Decide** — compare, prioritise, choose, commit.
- **Act** — acquire a target, operate a control, avoid accidental action.
- **Remember** — retain information or context across the task.
- **Learn** — understand an unfamiliar concept, feature, or interaction.
- **Wait** — maintain attention and trust through latency or asynchronous work.
- **Recover** — undo, retry, resume, escape, or preserve state after failure.
- **Finish** — understand the outcome, ending, confirmation, or next step.

Do not own styling, branding, design-system consistency, accepted implementation, generic accessibility compliance, copywriting, or broad visual polish unless one of the nine behavioural questions is materially unresolved.

**Routing test:** if identifying a behavioural mechanism would not change the design decision, do not invoke this skill.

Use `$intentional-design` for expressive task-first UI, hierarchy, feedback, state, and interaction character. Use `$doakes` for product-direction drift. Hand accepted implementation to `$ship-sound-code`.

## Choose a mode

### Diagnostic mode

Default for a specific behavioural problem, decision, or named law.

Use the decision procedure below and select at most three non-duplicative mechanisms. Prefer one strong explanation over several weak ones.

### Audit mode

Use when the user asks to **audit, review, inspect, critique, or improve a rendered interface or journey using UX laws**.

Audit the actual rendered evidence first: screenshot, prototype, recording, or running product. Do not claim visual findings from source code or component names alone.

Audit flow:

1. **Scan the view** across the nine friction classes.
2. **Identify hotspots** that could materially affect task success, comprehension, control, or recovery.
3. **Suggest 3–5 candidate UX laws** that could improve the experience, each tied to a specific observed hotspot and confidence level.
4. **Return fewer than three** if the evidence does not support three distinct laws. Never pad the list.
5. **Collapse the shortlist into 1–3 priority actions**. Candidate laws are hypotheses; fixes are the decision.
6. **Call out one collision or risk** where a law could be misapplied.

Audit candidate format:

`<Law> [confidence] — <observed hotspot> -> <why it may apply> -> <practical improvement>`

An Audit must not become a checklist of every law that could theoretically fit.

## Run the decision procedure

Use this sequence internally. Do not narrate it unless useful to the user.

1. **Frame** — `For <user>, in <context>, complete <task> while <constraint>.`
2. **Observe** — separate supplied or inspected evidence from inference.
3. **Classify** — choose the dominant friction class; add a second only if it changes the correction.
4. **Explain** — identify the simplest behavioural mechanism that plausibly explains the friction.
5. **Grade** — High, Moderate, or Low confidence using `references/evidence-strength.md`.
6. **Correct** — choose the smallest intervention that directly addresses the mechanism.
7. **Challenge** — test the correction against competing needs, accessibility, safety, ethics, and another plausible explanation.
8. **Validate** — state an observable result that would support or falsify the recommendation.

Stop early when the evidence is already decisive. If no behavioural mechanism improves the decision, return **no law needed**. If evidence cannot distinguish plausible explanations, return **insufficient evidence** and name the smallest useful test.

## Select mechanisms before laws

Use these stable mechanism IDs in evals and internal routing. User-facing output may use natural language.

| Friction | Canonical mechanisms |
| --- | --- |
| Find | `find.selective-attention`; `find.proximity`; `find.similarity`; `find.common-region`; `find.connectedness`; `find.distinctiveness` |
| Understand | `understand.mental-model`; `understand.cognitive-load`; `understand.grouping`; `understand.familiarity` |
| Decide | `decide.choice-complexity`; `decide.comparison-cost`; `decide.defaults`; `decide.serial-position` |
| Act | `act.target-acquisition`; `act.motor-accessibility`; `act.accidental-activation`; `act.acknowledgement` |
| Remember | `remember.working-memory`; `remember.recognition-over-recall`; `remember.chunking`; `remember.context-preservation` |
| Learn | `learn.familiarity`; `learn.learn-by-doing`; `learn.contextual-guidance`; `learn.mental-model` |
| Wait | `wait.acknowledgement`; `wait.status-visibility`; `wait.perceived-latency`; `wait.attention-continuity` |
| Recover | `recover.state-preservation`; `recover.error-tolerance`; `recover.reversibility`; `recover.retry-clarity` |
| Finish | `finish.outcome-clarity`; `finish.peak-end`; `finish.serial-position`; `finish.next-step` |

In Diagnostic mode, choose at most three **non-duplicative mechanisms**. In Audit mode, 3–5 candidate laws may map to more than three mechanisms, but the final action plan must still be prioritised to 1–3 changes.

Use `references/law-catalogue.md` only after the mechanism is clear. A law name must add explanatory or action value; otherwise omit it.

Do not stack near-synonyms such as Cognitive Load + Working Memory + Miller + Chunking merely to make a finding sound stronger.

## Require an evidence chain

Every material finding must survive:

`Observation -> mechanism [confidence] -> smallest correction -> collision/cost -> validation.`

- **Observation:** concrete supplied or inspected evidence, not `this feels confusing`.
- **Mechanism:** the behavioural explanation that best fits the observation.
- **Confidence:** strength of evidence *in this context*, not fame of the law.
- **Correction:** least disruptive change likely to address the mechanism.
- **Collision/cost:** what the correction could make worse or exclude.
- **Validation:** what result would support the mechanism and what would falsify it.

Analytics alone can show where behaviour changed, not why. Mark causal explanations as hypotheses unless supported by stronger evidence.

## Resolve collisions before optimising

- **Familiarity vs novelty:** keep commodity actions recognisable; spend novelty only where its value exceeds learning cost.
- **Choice reduction vs discoverability:** group, sequence, recommend, filter, search, or use safe defaults before hiding legitimate options.
- **Simplicity vs complexity:** remove accidental complexity; preserve consequential state, choices, and control.
- **Speed vs truth:** acknowledge quickly, but expose pending, failure, retry, and reversal honestly.
- **Progress vs pressure:** support user-chosen progress; reject fake urgency, streak anxiety, artificial incompleteness, and engagement theatre.
- **Aesthetics vs usability:** polish may improve perceived ease, never override observed task failure or accessibility barriers.
- **Tolerance vs security:** harmless human-input variation can be forgiving; money, identity, permissions, protocols, storage, and security boundaries require explicit validation.

## Treat accessibility and ethics as hard constraints

Behavioural optimisation never outranks accessibility, safety, informed consent, privacy, legal obligations, data integrity, or truthful system state.

Reject a recommendation whose success depends on making a legitimate alternative harder to notice, understand, select, undo, or leave. This includes hidden fees, false urgency, confirm-shaming, obstructed cancellation, misleading defaults, forced disclosure, disguised advertising, or visual interference designed to suppress a choice.

Do not weaken keyboard or assistive-technology operation, visible/programmatic state, labels, error association, reduced-motion support, target safety, input alternatives, or recovery.

## Avoid false precision

Read `references/evidence-strength.md` when a recommendation depends on empirical strength or transfer.

Never turn a rough tendency into a universal interface constant. In particular:

- Miller's `7±2` is not a menu-item limit.
- `400 ms` is not a universal Doherty latency SLA.
- Fitts does not mean every important control should be visually huge.
- Hick/Hyman does not mean fewer visible options always produce a better decision.
- Gestalt principles describe grouping tendencies; they do not justify arbitrary cardification.
- Peak-End and Zeigarnik are context-sensitive and must not justify pressure or compulsive engagement.

## Prefer the smallest correction

Typical moves:

- preserve context instead of testing memory;
- group semantically related content and separate unrelated controls;
- improve labels, hierarchy, spacing, hit area, or placement;
- prioritise/filter choices without removing legitimate access;
- reveal unfamiliar guidance when it becomes relevant;
- reuse known information through safe defaults or prefill;
- acknowledge actions immediately and show honest progress;
- add undo, retry, resume, or a clear escape;
- clarify outcome and next useful action.

Escalate to information-architecture or navigation redesign only when smaller corrections cannot resolve the observed friction.

## Validate by task

Match validation to the dominant friction:

- **Find:** time to correct action, wrong paths, search reformulation.
- **Understand:** comprehension, consequence prediction, error rate.
- **Decide:** decision time, comparison success, abandonment, justified confidence.
- **Act:** task success, misclicks, repeat submissions, accidental activation.
- **Remember:** backtracking, memory errors, copy/paste workarounds.
- **Learn:** time to first value, independent success, contextual-help use.
- **Wait:** duplicate actions, abandonment, perceived wait, trust in status.
- **Recover:** successful retry, preserved state, support contacts.
- **Finish:** outcome clarity, next-step success, later recall.

Conversion, engagement, retention, and time spent alone do not demonstrate better UX. Pair business outcomes with task success, comprehension, error, recovery, and user control.

## Report compactly

### Diagnostic mode output

**Verdict:** clear / friction / risk / evidence gap / no law needed.

**Task:** user + context + task + constraint.

**Evidence:** observed facts versus inference.

Then at most three findings:

`<Mechanism or law> [confidence] - <observation>; <why>; <smallest correction>; <collision>; <validation>.`

### Audit mode output

**Audit verdict:** strongest UX opportunities and evidence quality.

**Observed hotspots:** concise view-level problems, not generic design preferences.

**3–5 candidate laws:** each with confidence, evidence, why it applies, and one practical improvement. Return fewer if unsupported.

**Priority actions:** the 1–3 changes most likely to improve task success or reduce risk.

**Watch-out:** one likely misuse, collision, accessibility concern, or evidence gap.

For either mode, add a counterpoint only when a plausible alternative could change the recommendation. For implementation-ready work, hand explicit behaviour, states, constraints, and acceptance checks to `$ship-sound-code`.
