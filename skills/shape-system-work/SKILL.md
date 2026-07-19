---
name: shape-system-work
description: "Make an evidence-backed product or system decision before implementation. Use for unresolved product outcome, MVP scope, architecture, build-vs-buy, backlog shaping, or material business trade-off when no active local skill already owns that domain decision. Produce a delivery brief for implementation; do not use for a defined repository change."
---

# Shape System Work

Decide what to build, why it matters, and what must be proven. Produce a delivery brief; do not design implementation details or edit code.

## Coexist with local skills

If a user-invoked or active local skill has a narrower declared scope, let it own that specialised work. Reuse its confirmed artefacts; do not repeat its planning, edits, or tests. Retain only this skill's decision and delivery-brief role; ask the user if ownership remains genuinely unclear.

## Plan and route

Create a concise task list: frame the decision, test the proposition, choose a direction, then hand over a delivery brief. Keep one task in progress.

Use this skill before `$ship-sound-code` when the outcome, user value, architecture, scope, or commercial constraint is still uncertain. Hand over once a direction is chosen and the next work is a concrete repository change. If `$ship-sound-code` discovers that a code change would alter the product outcome or a major system decision, return here rather than silently making that choice.

Do not reopen a decision already settled by a more specific active planning skill unless new evidence contradicts it. Treat that skill's brief as the source decision and add only cross-cutting facts it has not addressed.

## Frame the real decision

State: `For <actor>, enable <outcome> under <constraints>, measured by <observable result>.`

Separate facts from assumptions. Identify the user job and current workaround; desired result and non-goals; decision owner; hard constraints (time, budget, skills, integrations, regulation, accuracy, latency); and irreversible decisions. Ask only questions that change those items; otherwise state a reversible assumption.

For specialised domains, model how practitioners make decisions, handle evidence and exceptions, and hand work off. Do not copy surface terminology into software.

## Pressure-test the proposition

Test four questions:

1. **User truth:** Does this solve a repeated job?
2. **Mechanism:** What creates a meaningful advantage over a generic implementation?
3. **Economics:** Can acquisition, operation, support, and variable cost fit the model?
4. **Trust:** Where can bad data, opaque logic, privacy, or overclaiming harm the user?

Name the weakest assumption and the cheapest test that could disprove it. Distinguish an MVP, which tests value, from a demo, which only proves a screen or integration can exist. Include one leverage point and one devil's-advocate counterpoint.

## Choose a proportionate direction

Define only the system facts needed for the decision: core entities and invariants, important commands or states, sources of truth, external boundaries, sensitive data, and recovery/audit needs. Keep deterministic rules separate from AI composition when both exist.

Compare no more than three options: baseline, recommended, and scale path only when materially different. Evaluate user value, correctness, delivery speed, operating cost, changeability, and team fit. Prefer a modular monolith and managed services unless a present need proves otherwise.

For each consequential choice, state context, chosen and rejected options, accepted trade-off, and revisit trigger. State what not to build.

## Produce the delivery brief

Hand this compact brief to `$ship-sound-code`:

- **Decision and outcome:** chosen direction, actor, and success evidence.
- **Scope:** first vertical slice, non-goals, and dependencies.
- **Invariants:** authorisation, data, workflow, or trust rules that must not break.
- **Constraints:** accepted architecture, integrations, cost or operational limits, and explicit trade-offs.
- **Verification:** acceptance criteria, proof required, and key failure/recovery path.
- **Open decision:** named owner and deadline, if one blocks safe implementation.

Order work by proof: hardest uncertainty, thin deployed path, core outcome, failure/security/recovery, then operational and scale work. Each slice must retire a risk or prove an outcome.

## Feed decisions forward

Report only material feedback as: **finding → evidence → impact → route/owner → required decision → closure proof**. Route an unresolved product or system choice to its decision owner; route the accepted delivery brief to `$ship-sound-code`. Close the feedback only when the brief records the chosen outcome, invariants, trade-off, and proof required.

## Respond efficiently

Return the decision, facts versus assumptions, recommended option with trade-off, delivery brief, leverage/trap, and next decision. Use diagrams only when a relationship or sequence is otherwise unclear. Read [examples.md](references/examples.md) only when a worked output shape would help.
