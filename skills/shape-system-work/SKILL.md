---
name: shape-system-work
description: Resolve an unsettled product or system decision and prepare an implementation brief. Use for MVP scope, architecture, or build-versus-buy choices; skip already defined repository changes.
---

# Shape System Work

Choose a direction that can be implemented and verified. Reuse accepted domain decisions and constraints from the current task.

## Frame the decision

Establish the actor, desired outcome, observable success, and hard constraints. Separate facts from assumptions and identify the decision that actually blocks progress. Ask only when a missing answer would materially change the outcome; state reversible assumptions for routine details.

Learn enough about the domain to preserve its rules, evidence, exceptions, and sources of truth. Read architecture, data, or deployment documentation when the decision touches those boundaries.

## Choose a direction

- Test whether the proposal addresses a real user job and improves on the current workaround.
- Examine economics or trust when they affect feasibility. Name the weakest important assumption and the cheapest useful test.
- Compare the baseline and recommended approach; add another option only when it presents a materially different trade-off.
- Describe only the system facts needed to decide: entities, invariants, important states, external boundaries, and recovery needs.
- Prefer a direct design. Add services or abstractions for current constraints, not an imagined future.
- Record consequential choices with their rationale, accepted cost, and revisit trigger.

Scale planning to the uncertainty. A small decision may need a paragraph. Use a task list or diagram only when it makes dependencies or choices easier to follow.

## Deliver the brief

Include the chosen outcome, first useful slice, non-goals, invariants, dependencies, accepted trade-offs, and acceptance evidence. Name any unresolved decision and its owner. Order slices to prove the hardest uncertainty before committing to dependent work.

Read [worked examples](references/examples.md) only when a concrete brief would help.

A planning-only request finishes with a usable brief or a clearly bounded missing decision. When implementation is also authorized, continue from the accepted brief without reopening settled choices or requesting the same permission again. `ship-sound-code` can guide that implementation if needed.

Commercial viability belongs to `shark-tank`; choosing between competing initiatives belongs to `strategic-gate`. Consult them only when their question remains unresolved.
