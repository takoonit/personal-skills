---
name: ship-sound-code
description: "Deliver a defined repository change with proportionate, YAGNI-driven standards and focused self-verification. Use as the general implementation workflow for features, bug fixes, APIs, data models, UI flows, and refactors when no active local skill owns the same specialised implementation. Do not use for unresolved product or architecture direction."
---

# Ship Sound Code

Turn a concrete request or approved delivery brief into the smallest complete, verifiable code change. Optimise for the user's job and the next developer's ability to understand, test, and safely change it.

## Coexist with local skills

If a user-invoked or active local skill has a narrower declared scope, let it own that specialised work. Reuse its confirmed artefacts; do not repeat its planning, edits, or tests. Retain only this skill's general implementation, scope, and hand-off role; ask the user if ownership remains genuinely unclear.

## Accept the hand-off and plan

Use the delivery brief from `$shape-system-work` as the product decision: preserve its outcome, scope, invariants, constraints, acceptance evidence, and open decisions. Do not reopen settled product choices without new evidence.

If the request lacks a concrete repository target, acceptance outcome, or an essential product/architecture decision, route it to `$shape-system-work`. If discovery during code work changes the outcome, major boundary, or commercial trade-off, pause and return a concise decision question there.

Before inspecting, reviewing, or changing code, create a concise Codex task list: orient and decide, implement or assess, then verify and hand over. Add a decision item only for a plausible material refactor, migration, or UX/DX conflict. Keep one item in progress and do not implement before the list exists.

Let framework, platform, security, data, or testing skills own their specific mechanics. Do not create a second plan when an active skill already has one; add only the missing cross-cutting acceptance, YAGNI, or hand-off checks. Treat an approved Dextor cleanup as a small specialised change; take ownership again only when it becomes a material refactor.

## Orient in the repository

Read repository instructions, relevant scripts/configuration, the nearest implementation, and tests. Trace caller/UI, validation, domain rule, persistence/external effect, and response. State acceptance criteria, invariants, meaningful failure behaviour, and out-of-scope work. Follow local conventions unless they cause a concrete defect, security risk, or recurring cost.

## Decide locally with YAGNI

Use the direct design by default. Add an abstraction, dependency, queue, cache, layer, or new pattern only for a present pressure: a real variation or second stable consumer; external/slow dependency; permission, tenancy, transaction, or integrity boundary; diverging duplicated rule; or measured operational constraint.

For a material code decision, state benefit now, existing pattern followed or reason to depart, cost, and the observable trigger for revisiting. Reject vague future-proofing and generic claims of being cleaner, scalable, or best practice.

## Consult before a material refactor

Pause before a rewrite affecting multiple features, public contracts, data/migrations, dependencies, module boundaries, deployment/rollback, or delivery plan. Compare the scoped change, refactor, staged option, and deferral. Show evidence, affected areas, delivery/verification/migration/rollback cost, a small local before/after example, and a short real-world analogy only if it clarifies the trade-off. Recommend one option and request a decision.

If undecided, complete only safe scoped work and record the follow-up. For active security, data-loss, or production incidents, contain the danger minimally first, then report the durable fix.

## Protect UX, DX, and correctness

- For user-facing work, preserve a clear job, minimum steps, completion signal, and recovery path. Cover relevant loading, empty, validation, error, success, permission, retry, accessibility, keyboard, and responsive states.
- For developer-facing work, preserve familiar commands, structure, naming, and configuration. Use strict types, boundary validation, meaningful names, and actionable failures; avoid hidden assumptions and clever integrations.
- Keep handlers/controllers/UI events thin; keep testable domain rules outside transport/framework bootstrapping.
- Narrow untrusted inputs and enforce server-side authorisation. Scope every multi-tenant read/write from trusted identity, not client input.
- Keep persistence/external details behind the smallest useful boundary. Do not create generic repositories or factories without a consumer.

Expose a material UX/DX conflict or a conflict with the delivery brief; return it as a decision rather than silently expanding scope.

## Feed implementation feedback forward

Report only material feedback as: **finding → evidence → impact → route/owner → required action → closure proof**. Route vague or contradictory intent to `$doakes`, unsettled product/system choices to `$shape-system-work`, and independent proof gaps to `$lundy`. Close a code finding only when the scoped change and its focused verification satisfy the stated invariant or acceptance outcome.

## Verify and hand over

Add focused tests for the changed behaviour: happy path, key invariant, and likely boundary/failure. Test wiring when wiring is the risk; avoid implementation-trivia tests. For UI, verify the primary journey and relevant states; for contracts, verify types, normal local use, and actionable failures. Run relevant format, type, lint, and test commands; say what was not run and why.

Before completion, challenge malformed/duplicate actions, stale state, partial failure, missing permission, tenant leak, compatibility/rollback break, and hypothetical complexity. Propose the narrowest correction for material risk.

Return only: change, verification, assumptions/risks, and one material follow-up. Include the claimed outcome, preserved invariants, changed scope, commands/results, and any unproved boundary so `$lundy` can independently validate without reconstructing the case. Use the full refactor case only when its threshold is met.
