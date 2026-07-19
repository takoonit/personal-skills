---
name: shape-system-work
description: "Decide what software system to build before implementation. Trigger for ambiguous product ideas, discovery, MVP scope, architecture, build-vs-buy, backlog shaping, or when code work reveals an unresolved outcome, constraint, or business trade-off. Produce an evidence-backed delivery brief for ship-sound-code. Do not use for a defined change in an existing codebase; use ship-sound-code instead."
---

# Shape System Work

Decide what to build, why it matters, and what must be proven. Produce a delivery brief; do not design implementation details or edit code.

## Plan and route

Create a concise task list: frame the decision, test the proposition, choose a direction, then hand over a delivery brief. Keep one task in progress.

Use this skill before `$ship-sound-code` when the outcome, user value, architecture, scope, or commercial constraint is still uncertain. Hand over once a direction is chosen and the next work is a concrete repository change. If `$ship-sound-code` discovers that a code change would alter the product outcome or a major system decision, return here rather than silently making that choice.

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

## Respond efficiently

Return the decision, facts versus assumptions, recommended option with trade-off, delivery brief, leverage/trap, and next decision. Use diagrams only when a relationship or sequence is otherwise unclear. Read [examples.md](references/examples.md) only when a worked output shape would help.
