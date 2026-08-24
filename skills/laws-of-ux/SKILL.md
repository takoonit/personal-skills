---
name: laws-of-ux
description: "Behavioural UX diagnostician for product interfaces and journeys. Use when human perception, attention, memory, choice, motor action, learning, waiting, recovery, or remembered experience could materially change a design decision: confusing navigation, hard-to-compare choices, recall-heavy flows, unfamiliar controls, misclicks, weak grouping, ambiguous feedback, progress pressure, rough endings, or questionable uses of Hick, Fitts, Miller, Jakob, Peak-End, Gestalt, cognitive load, and related UX principles. Do not use for styling, branding, design-system work, implementation-only tasks, generic accessibility compliance, copywriting, or broad UI polish unless a behavioural mechanism is genuinely in dispute. Diagnose evidence before naming laws, select at most three distinct mechanisms, grade confidence, expose competing constraints and ethical risk, prefer the smallest falsifiable correction, and explicitly allow a no-law or insufficient-evidence verdict."
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
- **Act** — acquire a target, operate a control, avoid accidental action.
- **Remember** — retain information or context across the task.
- **Learn** — understand an unfamiliar concept, feature, or interaction.
- **Wait** — maintain attention and trust through latency or asynchronous work.
- **Recover** — undo, retry, resume, escape, or preserve state after failure.
- **Finish** — understand the outcome, ending, confirmation, or next step.

Also own explicit requests to validate a named UX law.

Do not own styling, branding, design-system consistency, accepted implementation, generic accessibility compliance, copywriting, or broad visual polish unless one of the nine behavioural questions is materially unresolved.

**Routing test:** if identifying a behavioural mechanism would not change the design decision, do not invoke this skill.

Use `$intentional-design` for expressive task-first UI, hierarchy, feedback, state, and interaction character. Use `$doakes` for product-direction drift. Hand accepted implementation to `$ship-sound-code`.

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

Choose at most three **non-duplicative mechanisms**. Prefer fewer.

| Friction | Candidate mechanisms |
| --- | --- |
| Find | selective attention; proximity; similarity; common region; connectedness; distinctiveness |
| Understand | mental model; cognitive load; grouping; familiarity |
| Decide | choice complexity; comparison cost; defaults; serial position |
| Act | target acquisition; motor accessibility; accidental activation; acknowledgement |
| Remember | working memory; recognition over recall; chunking; context preservation |
| Learn | familiarity; learn-by-doing; contextual guidance; mental model |
| Wait | acknowledgement; status visibility; perceived latency; continuity of attention |
| Recover | state preservation; error tolerance; reversibility; retry clarity |
| Finish | outcome clarity; peak-end weighting; serial position; next-step orientation |

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

Default output:

**Verdict:** clear / friction / risk / evidence gap / no law needed.

**Task:** user + context + task + constraint.

**Evidence:** observed facts versus inference.

Then at most three findings:

`<Mechanism or law> [confidence] - <observation>; <why>; <smallest correction>; <collision>; <validation>.`

Add a short counterpoint only when a plausible alternative could change the recommendation.

End with **Direction:** the leanest viable changes in priority order. For implementation-ready work, hand explicit behaviour, states, constraints, and acceptance checks to `$ship-sound-code`.
