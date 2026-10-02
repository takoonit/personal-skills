---
name: ship-sound-code
description: "Deliver a defined repository change with proportionate, YAGNI-driven standards and focused self-verification. Use for features, bug fixes, APIs, data models, UI flows, refactors, and establishing or auditing repository-specific coding standards, architecture guardrails, testing practices or CI quality gates when no active local skill owns the specialised work. Reuse existing conventions and checks for routine changes. Route unresolved product or consequential architecture choices to shape-system-work when available."
---

# Ship Sound Code

Turn a concrete request or approved delivery brief into the smallest complete, verifiable code change. Optimise for the user's job and the next developer's ability to understand, test, and safely change it.

## Coexist with local skills

If a user-invoked or active local skill has a narrower declared scope, let it own that specialised work. Reuse its confirmed artefacts; do not repeat its planning, edits, or tests. Retain only this skill's general implementation, scope, and hand-off role; ask the user if ownership remains genuinely unclear.

Companion skills are optional. Use a named hand-off only when that skill is available. Otherwise clarify intent directly, present the unresolved decision and trade-offs, or report missing independent verification without claiming it occurred. Continue authorised work that does not depend on that decision.

## Accept the hand-off and plan

Use an existing delivery brief from `$shape-system-work` or the user's concrete request as the product decision: preserve its outcome, scope, invariants, constraints, acceptance evidence, and open decisions. Do not require a separate brief or reopen settled choices without new evidence.

Infer the repository target and acceptance outcome from the request and available workspace evidence. Ask a focused question only if a material ambiguity remains. Route unresolved product/architecture choices to `$shape-system-work` when available; missing routine details alone do not need that workflow. If discovery changes the agreed outcome, major boundary or commercial trade-off, pause only the affected work and present a concise decision.

For a standards/setup request, first inspect the supplied repository and goal. Derive routine tooling and documentation choices from that evidence; do not require an architecture workshop or a chosen architecture label. Ask only about material gaps. A user-approved plan already authorises its scoped implementation; do not ask for the same decision again.

Before inspecting, reviewing, or changing code, create a concise task list: orient and decide, implement or assess, then verify and hand over. Use the available planning tool or a short in-message checklist; no particular tool or repository file is required. Add a decision item only for a plausible material refactor, migration, or UX/DX conflict. Keep one item in progress and do not implement before the list exists.

Let framework, platform, security, data, or testing skills own their specific mechanics. Do not create a second plan when an active skill already has one; add only the missing cross-cutting acceptance, YAGNI, or hand-off checks. Treat an approved Dextor cleanup as a small specialised change; take ownership again only when it becomes a material refactor.

## Orient in the repository

Read repository instructions, relevant scripts/configuration, the nearest implementation, and tests. Trace caller/UI, validation, domain rule, persistence/external effect, and response. State acceptance criteria, invariants, meaningful failure behaviour, and out-of-scope work. Follow local conventions unless they cause a concrete defect, security risk, or recurring cost.

Read existing `CODEBASE.md`, `CODE-GUARDRAILS.md`, CONTRIBUTING guidance and relevant ADRs when present. For UI work, also inherit DESIGN.md and its guardrails; keep visual and engineering authorities distinct. Identify canonical rules, implementation drift and unknowns rather than treating every existing pattern as intentional.

## Establish standards when the task calls for them

Read [repository-standards.md](references/repository-standards.md) when setting up a new codebase, explicitly establishing/auditing engineering standards, or repairing a material gap in a relevant quality gate. For a routine feature or fix, follow existing standards and run focused checks; do not generate governance files, replace tooling or restructure the repo as a side effect.

Match actions to the request: an audit is read-only unless fixes are authorised; a gate repair changes only the affected check and necessary documentation; standards setup may establish the broader system. For audits, report evidence, impact and proposed corrections without creating standards files, changing policy or inserting violating fixtures into the user's tree.

For authorised setup, produce or update a concise `CODEBASE.md` and `CODE-GUARDRAILS.md`, or reuse equivalent existing documents. Record responsibilities, allowed dependency directions, sources of truth, canonical implementation examples and runnable verification commands. Connect each guardrail to a real automated check or an explicit review responsibility. Wire discovery through the applicable project agent instructions without duplicating unrelated policies.

Implement the appropriate repository configuration within scope, then verify it. Distinguish a documented rule, a configured check, a check that passed, and an active merge restriction. Never claim that a Markdown file, local hook or CI workflow alone blocks merges.

## Decide locally with YAGNI

Use the direct design by default. Add an abstraction, dependency, queue, cache, layer, or new pattern only for a present pressure: a real variation or second stable consumer; external/slow dependency; permission, tenancy, transaction, or integrity boundary; diverging duplicated rule; or measured operational constraint.

For a material code decision, state benefit now, existing pattern followed or reason to depart, cost, and the observable trigger for revisiting. Reject vague future-proofing and generic claims of being cleaner, scalable, or best practice.

Define responsibilities and dependency direction before choosing architectural labels. Group by cohesive business capability; sharing a user identifier does not make billing and profile management one domain. Keep one authority for a business rule or datum; distinguish permitted derived representations and caches from independently maintained truths. Prefer local consistency over a repository-wide reorganisation without demonstrated need.

## Consult before a material refactor

Proceed with a directly requested or already approved refactor within its agreed boundaries. Pause only for newly discovered, material expansion affecting features, public contracts, data/migrations, dependencies, module boundaries, deployment/rollback or delivery plan. Compare the scoped change, refactor, staged option and deferral. Show evidence, affected areas, delivery/verification/migration/rollback cost, a small local before/after example, and an analogy only if it clarifies the trade-off. Recommend one option and request only the unresolved decision.

If undecided, complete only safe scoped work and record the follow-up. For active security, data-loss, or production incidents, contain the danger minimally first, then report the durable fix.

## Protect UX, DX, and correctness

- For user-facing work, preserve a clear job, minimum steps, completion signal, and recovery path. Cover relevant loading, empty, validation, error, success, permission, retry, accessibility, keyboard, and responsive states.
- For developer-facing work, preserve familiar commands, structure, naming, and configuration. Use appropriate type checking for the language, boundary validation, meaningful names, and actionable failures; avoid hidden assumptions and clever integrations.
- Keep handlers/controllers/UI events thin; keep testable domain rules outside transport/framework bootstrapping.
- Narrow untrusted inputs and enforce server-side authorisation. Scope every multi-tenant read/write from trusted identity, not client input.
- Keep persistence/external details behind the smallest useful boundary. Do not create generic repositories or factories without a consumer.

Expose a material UX/DX conflict or a conflict with the delivery brief; return it as a decision rather than silently expanding scope.

## Design for useful tests

Keep deterministic business rules pure where practical. Pass external dependencies through explicit parameters, constructors or existing framework DI; add an interface/container only when a real boundary or substitution needs it. Avoid mocking every internal call or removing meaningful side effects merely to increase unit-test count.

Choose tests by the failure being prevented: unit tests for calculations and rules; integration tests for persistence, permissions, transactions and external contracts; a small set of end-to-end tests for critical journeys. Treat the testing pyramid as guidance, not a fixed ratio. Coverage is a diagnostic and an optional calibrated gate, not proof of correctness; never impose an arbitrary universal percentage.

## Feed implementation feedback forward

Report only material feedback as: **finding → evidence → impact → route/owner → required action → closure proof**. Route vague or contradictory intent to `$doakes`, unsettled product/system choices to `$shape-system-work`, and independent proof gaps to `$lundy`. Close a code finding only when the scoped change and its focused verification satisfy the stated invariant or acceptance outcome.

## Verify and hand over

Add focused tests when warranted by changed behaviour or risk: happy path, key invariant, and likely boundary/failure. Do not add tests for low-impact reversible edits or merely mirror the implementation. Test wiring when wiring is the risk. For UI, verify the primary journey and relevant states; for contracts, verify types, normal local use, and actionable failures. Run the established relevant format, type/static-analysis, lint, boundary, build and test commands; report what passed, failed or remains unverified. Do not expand testing after adequate evidence unless a required gate or concrete unresolved risk warrants it.

For standards/setup work, use the reference's enforcement verification in addition to normal checks. Preserve failing checks and report existing violations; do not weaken rules, skip jobs or pad coverage to create a green result. Keep documentation and deliberate pattern changes aligned, and update ADRs only for consequential decisions. Prioritise refactoring by defects, change friction and operational risk rather than imposing a fixed sprint percentage.

Before completion, challenge malformed/duplicate actions, stale state, partial failure, missing permission, tenant leak, compatibility/rollback break, and hypothetical complexity. Propose the narrowest correction for material risk.

Return change or audit findings, verification, material assumptions/risks, and a follow-up only if needed. Include the claimed outcome, relevant preserved invariants, changed scope, commands/results, and any unproved boundary so an independent reviewer can validate without reconstructing the case. Use the full refactor case only when its threshold is met.
