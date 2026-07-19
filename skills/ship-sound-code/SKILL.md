---
name: ship-sound-code
description: "Guide implementation and review with proportionate, YAGNI-driven standards. Trigger when asked to build, modify, debug, refactor, review, or plan application code; evaluate a design; or decide whether an abstraction or refactor is worth its cost. Apply to feature, bug-fix, API, data-model, UI-flow, and technical-debt work requiring balance of codebase consistency, DX, UX, security, tests, and trade-offs."
---

# Ship Sound Code

Build the smallest complete, verifiable change. Optimise for the user's job and the next developer's ability to understand, test, and safely change it.

## Plan first

Before inspecting, reviewing, or changing code, create a concise Codex task list using the available planning mechanism. Make each item outcome-based and verifiable, not a micro-step. Start with the smallest useful sequence—normally orient and decide, implement or assess, then verify and hand over. Add a separate decision item when a material refactor, migration, or UX/DX trade-off is plausible.

Keep exactly one item in progress. Update the list when discovery changes scope, and mark each item complete only after its verification is done. Do not start implementation before the list exists.

## Orient

Read repository instructions, relevant scripts/configuration, the nearest implementation, and its tests. Trace the path from caller/UI through validation and domain rules to persistence/external effects and response.

State only the acceptance criteria, invariants, meaningful failure behaviour, and out-of-scope work. Ask only questions whose answers would change the design.

Follow local conventions unless they cause a concrete defect, security risk, or recurring cost.

## Decide with YAGNI

Use the direct design by default. Add an abstraction, dependency, queue, cache, layer, or new pattern only for a present pressure: a real variation or second stable consumer; an external/slow dependency; a permission, tenancy, transaction, or integrity boundary; a diverging duplicated rule; or a measured operational constraint.

For a material choice, make this compact case:

| Check | State |
| --- | --- |
| Benefit | What it improves now: requirement, risk, delivery constraint, or measured bottleneck. |
| Fit | Existing pattern followed, or why departure is justified. |
| Cost | Code, coupling, migration, operations, performance, or flexibility cost. |
| Trigger | Observable condition that justifies more complexity later. |

Reject vague future-proofing. Prefer a reversible, explicit implementation. Do not cite “cleaner”, “scalable”, or “best practice” without a project-specific benefit and cost.

## Consult before a material refactor

Pause before a working-pattern rewrite that affects multiple features, public contracts, data/migrations, dependencies, module boundaries, deployment/rollback, or the delivery plan. Do not quietly expand scope.

Present: evidence from the code/workflow; scoped, refactor, staged, and defer options; affected areas and delivery/verification/migration/rollback cost; a small local before/after example; and a recommendation with the decision required. Use a short real-world analogy only when it makes the trade-off clearer.

If undecided, complete only safe scoped work and leave the refactor as follow-up. For active security, data-loss, or production incidents, contain the danger minimally first, then report the durable option.

## Protect UX and DX

For user-facing work, define the user’s job, minimum steps, completion signal, and recovery path. Keep the mental model clear; include relevant loading, empty, validation, error, success, permission, retry, accessibility, keyboard, and responsive states. Prefer prevention, useful defaults, retained input, and progressive disclosure over extra screens and options.

For developer-facing work, preserve familiar commands, structure, naming, and configuration. Make contracts discoverable with strict types, boundary validation, meaningful names, and actionable failures. Avoid hidden assumptions and clever integrations that make setup, debugging, tests, or later changes harder.

Expose a material UX/DX conflict in the decision case; consult the user if it changes behaviour, scope, or maintenance cost.

## Implement and verify

- Keep handlers/controllers/UI events thin; put testable domain rules outside transport and framework bootstrapping.
- Use strict domain types; narrow untrusted inputs; make invalid transitions and async failures explicit.
- Enforce authorisation server-side. Scope each multi-tenant read and write from trusted identity, not client input.
- Keep external/persistence details behind the smallest useful boundary. Do not create generic repositories or factories without a consumer.
- Add focused tests for the changed behaviour: happy path, key invariant, and likely boundary/failure. Test wiring where wiring is the risk; avoid implementation-trivia tests.
- For changed UI, verify the primary journey and relevant states. For changed contracts, verify types, normal local use, and actionable failures.
- Run relevant format, type, lint, and test commands; say what was not run and why.

Before completion, challenge the result: malformed or duplicate action, stale state, partial failure, missing permission, tenant leak, compatibility/rollback break, or complexity that is merely hypothetical. Propose the narrowest correction for any material risk.

## Respond efficiently

Use the checklist internally; do not narrate it. Surface only decisions, exceptions, risks, and evidence that affect the user’s choice. For ordinary implementation/review, finish with four short items: change, verification, assumptions/risks, and one material follow-up. Use the full refactor case only when the refactor threshold is met.
