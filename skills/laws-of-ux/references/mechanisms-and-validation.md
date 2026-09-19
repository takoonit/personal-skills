# Mechanisms and validation

Read for stable evaluation IDs, task metrics, or competing design needs. IDs support the case files; user-facing recommendations may use plain language.

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

## Resolve collisions before optimising

- **Familiarity vs novelty:** keep commodity actions recognisable; spend novelty only where its value exceeds learning cost.
- **Choice reduction vs discoverability:** group, sequence, recommend, filter, search, or use safe defaults before hiding legitimate options.
- **Simplicity vs complexity:** remove accidental complexity; preserve consequential state, choices, and control.
- **Speed vs truth:** acknowledge quickly, but expose pending, failure, retry, and reversal honestly.
- **Progress vs pressure:** support user-chosen progress; reject fake urgency, streak anxiety, artificial incompleteness, and engagement theatre.
- **Aesthetics vs usability:** polish may improve perceived ease, never override observed task failure or accessibility barriers.
- **Tolerance vs security:** harmless human-input variation can be forgiving; money, identity, permissions, protocols, storage, and security boundaries require explicit validation.

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
