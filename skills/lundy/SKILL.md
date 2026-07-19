---
name: lundy
description: "Independently validate high-risk or cross-boundary completed code work—especially a Dextor cleanup, refactor, migration, or feature—using focused subagent evidence lanes. Use when independent proof is needed beyond the implementer's own checks; do not use for routine completion or as a replacement for a specialised test skill. Return a clear verdict and smallest next action."
---

# Lundy

Lead a small forensic validation task force after the work is done. Treat the implementation, test results, and claim of completion as evidence to examine, not proof in themselves. The primary agent owns the verdict and user communication; subagents supply independent, bounded checks.

## Coexist with local skills

If a user-invoked or active local skill has a narrower declared scope, let it own that specialised work. Reuse its confirmed artefacts; do not repeat its planning, edits, or tests. Retain only this skill's independent validation and verdict role; ask the user if ownership remains genuinely unclear.

## Open validation only when it earns its cost

Use Lundy after a meaningful feature, refactor, bug fix, migration, dependency/configuration change, or Dextor removal. Prefer it when failure would be costly, the change crosses boundaries, or the implementer’s tests do not independently prove the claimed result.

Do not form a task force for a trivial local edit with focused tests and an obvious result. Do not use Lundy to decide what to build—that belongs to `$shape-system-work` and `$doakes` before implementation.

Let framework-specific test, browser, security, performance, and deployment skills run their specialised checks. Lundy chooses only the independent questions still unproved, coordinates them without overlapping writes, and reconciles their evidence into one verdict.

State the completion claim, intended observable outcome, changed scope, invariants, and available proof: diff, commands run, test results, contracts, and acceptance criteria. Separate verified facts from the implementer's assertions.

## Assign independent evidence lanes

Create a concise task list, then use two or three non-overlapping, read-only lanes by default. Give each lane a question, scope, and proof required. Never let validation agents edit the same files or repair the work while validating it.

- **Behaviour tracer:** follow the primary user/API path from input through response and persisted state. Compare observed behaviour with the completion claim and acceptance criteria.
- **Breaker:** search for likely regression, failure, permission, tenancy, compatibility, rollback, boundary, or duplicate-action cases. Use `$doakes` only when the completed change may have drifted from project intent.
- **Evidence auditor:** check tests, contracts, build/deploy configuration, documentation, and claimed removals. After `$dextor`, trace references, runtime entry points, scripts, dynamic loading, and public contracts before accepting that a deletion is safe.

Pass raw artifacts and the claimed result, not a preferred verdict. Delegate only questions that could change the validation outcome. Treat each response as evidence to verify against source files, test output, or a reproducible path.

## Reach a verdict

Reconcile findings without averaging opinions:

- **Validated:** the intended outcome and invariants have direct, relevant proof; no material contradiction remains.
- **Partly verified:** the primary path is proven, but a named boundary, environment, or compatibility claim lacks proof.
- **Not validated:** evidence contradicts the claim, an invariant fails, or the removal/change has an unaddressed material risk.
- **Blocked:** the required environment, access, fixture, or source of truth is missing; name exactly what would unblock it.

For each unverified or failed item, state the evidence, impact, and smallest next action. Do not turn minor test gaps into a redesign. Route fixes to `$ship-sound-code`; route a changed product decision to `$shape-system-work`.

## Feed validation feedback forward

Report only material feedback as: **finding → proof or missing proof → impact → route/owner → required action → closure proof**. Route a defect or unproved technical claim to `$ship-sound-code`, a changed product decision to `$shape-system-work`, and a suspected intent mismatch to `$doakes`. Close `partly verified` or `not validated` only when the named proof is rerun and the verdict changes or the remaining limitation is explicitly accepted.

## Report the case file

Return only:

- **Verdict:** validated, partly verified, not validated, or blocked.
- **Proof:** the decisive checks and what they establish.
- **Gap or failure:** only material missing or contradictory evidence.
- **Next action:** the smallest test, clarification, or fix needed.

Mention the subagent task force only when independent review materially strengthens the result or reveals a disagreement. Do not report internal activity as progress.
