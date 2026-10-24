# Design before building

This is the shared delegate recipe for Work Items. Follow it after drafting the plan and before product branches, code, tests or configuration edits. The v3 runtime invokes the existing checker at plan admission, approval and new-writer admission. The host performs the design work; the checker validates declared relationships and bytes without dispatching agents.

## Required sequence

1. Draft the developer plan and realistic ranges. Reuse `how` grounding and run `why` when ownership/layering rationale is a design constraint. Include the architecture, candidate comparison, review and expected correction cost in active AI work; show human effort and external waits separately.
2. Run `pstack:architect`. Its Sketch phase runs `pstack:arena` once using the configured **architect runners**. Produce at least two structurally distinct whole designs, read/screen every candidate, run one cross-judge selected from the **arena cross-judge pool**, select a base and graft coherent improvements. Preserve the selected sketch and rationale, alternatives, scores, dissent and source candidates.
3. Run `pstack:interrogate` on that exact synthesized sketch/rationale using every configured reviewer seat. Retain raw reports and stable finding IDs. The lead classifies each declared finding into Act On, Consider, Noted or Dismissed, with its originating reviewer and rationale. Do not automatically apply reviewer suggestions. Any Act On holds building. After accepted design changes, update the saved design and renew review of the changed subject; preserve the earlier reports and decision trail.
4. Validate the evidence package below. Incorporate the chosen design, tests, blockers and revised estimates into the final developer plan. Substantive design changes require renewed architect/arena and interrogation. Proven operational changes can reuse an intact v2 package as described below; never relabel historical stage hashes. Anticipate design/review cost in the draft to avoid unnecessary revisions.
5. Show the complete final developer plan in chat and obtain genuine explicit approval through the existing delivery workflow. Rerun the design checker before branches/edits and when `cursor` advises `start-unit`, alongside normal source, workspace, owner and runtime readiness checks. A failed check holds the agent's building step. Passing it never supplies consent or clears other holds.

This sequence overrides architect's default transition directly into implementation. There is no second arena between architect and interrogate. If a narrow task needs little new architecture, keep its sketches and reports small; do not silently skip the requested design stage.

During implementation, keep the chosen sketch/rationale as the shared contract. Compare each accepted deviation with its behavior, interfaces and ownership; update that existing artifact with the acceptance source before the next unit. Renew review for changed contracts and renew user approval for material plan changes. Repeated structural friction returns to architect's Scrap/Sketch phases rather than accumulating workarounds.

## Diagnosis and coding discipline

For a bug, apply `pstack:principle-fix-root-causes` during investigation, before choosing the fix. Reproduce the reported state, trace backward to the first wrong decision or missing handling, and inspect actual errors/state rather than guessing. Decide whether the triggering state is legitimate. Fix its producer when it should not exist; handle it at the failing boundary when it is legitimate. Inspect sibling callers for the same fault. A failed setup is not reproduction, and a guard, retry, swallowed error or discarded state must not hide an unexplained cause. Record remaining uncertainty and its observable next check in the plan.

Before coding each approved unit, apply `pstack:principle-guard-the-context-window`. Bound the phase by its goal, owned files, affected callers/tests/fixtures/config/exports, saved design contract, verification and stop conditions. Set file/read-output and turn budgets appropriate to that unit, accounting for model/tool overhead; use targeted searches and excerpts rather than repeated whole-file reads. Keep large artifacts in the external run directory and carry concise findings with evidence pointers. Use already authorized delegates for independent bulk work when helpful, with separate output ownership. Split a unit when its scope no longer fits; material scope/design changes return through the existing review and approval gates.

When the requested code change has a matching, cheap local project test pattern, apply the user's conditional `pstack:tdd` request after implementation approval and before the production change. Prefer the nearest existing behavioral unit/component/regression seam. A test framework being installed is not enough: the check must expose the target behavioral mismatch deterministically without broad new infrastructure or mock-heavy fixture churn. Write the focused failing test, run it before implementation, and retain the actual failure content proving the intended mismatch. Then implement the behavior, fixing the root cause for bugs, and retain the passing test plus affected nearby checks. A setup/import error or a test that already passes does not supply failing-before evidence. Never change assertions to bless wrong behavior.

If no practical matching test seam exists, explicitly record why TDD was skipped and use the closest useful executable reproduction, targeted script, browser/log assertion or other supported check. Keep the existing test/evidence completion gates; an impractical new test does not waive verification or justify an invented harness. Do not force TDD onto documentation-only work or code changes without a useful behavioral test path.

After coding each unit, apply `pstack:deslop` to its scoped diff against the approved repository baseline before `finish`/handoff. Remove unnecessary comments, abnormal defensive wrappers, bypass casts, avoidable nesting and departures from nearby patterns. Keep behavior and the accepted architecture intact. Preserve repository-required controller try/catch, meaningful trust-boundary validation, transaction/error propagation and other real safety contracts. Do not replace focused cleanup with a broad rewrite. Rerun affected checks after substantive cleanup; if cleanup reveals a behavioral bug, use root-cause diagnosis and the conditional regression path rather than silently changing behavior.

In the handoff, identify the reproduced cause, applicable TDD check and trimmed failing-before/passing-after evidence, or the skip reason and replacement check. Include deslop in the existing review/correction estimate rather than adding an unsupported fixed surcharge. These are agent instructions and review obligations; the design checker does not certify root-cause correctness, TDD quality or code style.

## Roles and isolated outputs

Resolve model roles from explicit live user/session overrides, then applicable repository/global AGENTS instructions, then the pstack sheet. Read the actual current sources. Resolve available models and effort on the current host; do not assume another machine's model names or settings. Use the skill's effort rules and retain actual requested/resolved model metadata in raw reports. A configured seat that cannot run is incomplete, not permission to manufacture or omit it.

Pass the authoritative role file to the checker. For conflicting overrides, supply a clearly labelled resolved snapshot with provenance identifying the higher-precedence decision. The checker reads the three exact role rows; it cannot establish that the operator chose the authoritative configuration. Resolve `auto`/`inherit-parent` in that snapshot rather than asking the checker to guess. A pool supplies one judge, not one judge per pool member.

Every candidate/reviewer writes its own external directory. Delegates read this recipe and the relevant pstack prompt templates; they cannot edit the shared recipe or each other's files. The orchestrator owns synthesis and findings classification. Store design artifacts outside product repositories, next to the run evidence. Use `show-me-your-work` for one canonical decision trail; partial artifacts are not a second execution ledger.

## Check command

In Ubuntu WSL, use the installed Node 22+ runtime and real absolute paths:

```sh
node $WORK_ITEM_DELIVERY_ROOT/scripts/check-design.mjs \
  --plan RUN/plan.json --file RUN/design/review.json \
  --models $PSTACK_MODELS_FILE
```

It prints `DESIGN_CHECKED` and the current plan/configuration/selected-design hashes, or exits nonzero with `INCOMPLETE`. It reads files only. It neither writes `delivery.json` nor initializes a store, invokes models, creates branches or records approval. Use `work-item-delivery design-context --run RUN --file PLAN` for exact `plan_hash`, `projection_version: 2` and projected `design_hash`. The final v3 approval hash additionally binds manifest and model bytes. Do not add the completed manifest to that plan's sources: it refers to the plan hash and would create a circular dependency.

## Manifest contract

Use schema `work-item-delivery.design.v1`. Artifact receipts are `{ "path": "relative-or-absolute-file", "sha256": "64 lowercase hex characters" }`; relative paths resolve from the manifest directory. Every artifact must exist and be nonempty. Compute a sketch/rationale pair digest as SHA-256 of `JSON.stringify({sketch: sketch.sha256, rationale: rationale.sha256})` in that key order.

| Field | Required content |
| --- | --- |
| `plan_hash`, `models_sha256` | Current full plan/source fingerprint and configuration file SHA-256. |
| `architect.grounding` | Nonempty array of grounding artifact receipts. |
| `architect.candidates` | One row per configured runner, in any order. Each has `seat` (`architect-1..N` in configured order), `model`, the stage's actual `plan_hash`/`models_sha256`, declared `shape`, and `sketch`/`rationale` receipts. At least two distinct shape labels and distinct sketch paths. Structural quality remains judgment. |
| `architect.cross_judge` | One configured-pool `model`, its actual input context hashes, raw `report` receipt and `candidates` rows containing exactly every candidate `seat` and pair `digest`. |
| `architect.selected` | Valid `base_seat`, final `sketch` and `rationale` receipts. Rationale includes base choice, cross-judge decision, graft sources, rejected alternatives and why. |
| `interrogate.subject_sha256` | Exact final selected pair digest. |
| `interrogate.reviewers` | One row per configured reviewer. Each has `seat` (`reviewer-1..N`), `model`, actual input context hashes, `outcome: "completed"`, exact `subject_sha256`, its own raw `report` receipt and `findings` array. Each finding has stable `id` and nonempty `summary`. Report paths must differ. |
| `interrogate.judgment` | Lead judgment artifact receipt, using interrogate's required synthesis format. |
| `interrogate.findings` | Exactly one disposition per declared reviewer finding. Each has `reviewer` seat, `finding` ID, exact `bucket` and nonempty `rationale`. Unknown, missing or duplicate references and any Act On are refused; `resolved: true` cannot override a hold. |

Stage context declarations identify what was actually provided to that stage. A producer must not relabel old results as a new plan/configuration. Retain original reports when renewing stages. Reconcile declared findings against every raw report; the checker does not parse arbitrary prose or prove that no finding was omitted.

## Reuse after operational changes

A `work-item-delivery.design.v2` manifest keeps all v1 fields and original stage `plan_hash` values, adding:

```json
{
  "origin_plan": {"path": "origin-plan.json", "sha256": "EXACT-ORIGINAL-PLAN-FILE-SHA256"},
  "projection_version": 2,
  "design_hash": "ORIGINAL-DESIGN-CONTEXT-DIGEST"
}
```

Archive the exact original plan before making this wrapper. The checker verifies its bytes, recomputes its exact source context, checks every historical panel against that original context and current model bytes, then compares the original and current design projections. It retains all candidate, subject, artifact, finding and configured-seat checks. No command automatically renews historical panels.

The neutral list is repository `branch`, policy `branch_prefix`, unit `priority`, check `timeout_ms`, and design manifest/model file locators. Model bytes, repository primary path/baseline, admission/dossier, sources, acceptance, blockers and unknown fields remain substantive. A rationale-only new dossier may preserve implementation while still requiring renewed design evidence. V1 stays exact. Missing original plan or changed substantive input requires renewed evidence. Exact approval always binds the current plan and design/model bytes separately.

## Resume, evidence and limits

On unchanged inputs, reuse the existing package and rerun the check; do not repeat a valid arena merely because the chat resumed. On substantive design, cited byte or configuration changes, renew the affected package against the final input and show material changes for renewed plan approval. Operational reuse follows the v2 contract below. After selected sketch/rationale changes, every interrogation subject must be renewed. Missing access, capacity or required review stays a visible hold.

Preserve an already admitted active owner. Finish or explicitly park its dirty/partial work through existing recovery rules before enforcing the new stage at the next safe unit boundary. The checker neither releases owners nor locks checkouts across runs. Exact-content ticket/PR publication approval remains separate; design agreement or `ready-for-agent` never authorizes it.

This checks byte integrity and declared relationships, not semantic design quality, true model execution, independence, authentic configuration selection, approval provenance, remote freshness, deployed behavior or SIT acceptance. The supplied files must remain stable while checking; the result is a snapshot. Readiness still comes from actual current receipts, source reads and owner checks. The configured design panel uses GPT-family seats; disclose that reduced diversity. A separately requested Claude review is additional evidence, not a substitute for a configured seat.

## Rerunnable verification

```sh
cd $WORK_ITEM_DELIVERY_ROOT
node --test test/check-design.test.mjs
```

Tests include actual CLI read-only/idempotent behavior, corruption and deletion of each evidence file, plan/configuration drift and stale stage contexts, missing/duplicate seats, judge-pool membership, candidate/subject mismatches and missing/orphaned/duplicate/Act On dispositions. Fixtures are synthetic, never live Work Item approval. Run existing spec-renderer regressions when changing the surrounding workflow.
