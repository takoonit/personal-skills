# Proof of Works operator guide

Use `scripts/proof-of-work.mjs` from the shared work-item-delivery checkout. It gathers local evidence for a PR draft; it never publishes.

## Choose a mode

```sh
node scripts/proof-of-work.mjs --run "$RUN" --repo "$REPO" --file "$SCOPE" --out "$OUT"
node scripts/proof-of-work.mjs --run "$RUN" --repo "$REPO" --file "$SCOPE" --out "$NEW_OUT" --execute
node scripts/proof-of-work.mjs --run "$RUN" --repo "$REPO" --file "$SCOPE" --out "$OUT" --check
```

- Default collection reads the latest saved verification; it runs no tests and does not save delivery state.
- `--execute` invokes existing `Delivery.verify(repo)` once, then collects. It executes the approved repository checks, records results and clears prior verification/review/publication state through that runtime. Use a fresh output directory.
- `--check` recomputes evidence and compares both existing output files byte for byte; it writes nothing and runs no tests. It cannot combine with `--execute`.
- A zero CLI exit means the current recorded test scope passes collector checks. A nonzero exit can mean an incomplete bundle was written or that collection refused invalid evidence; inspect both the result and output files.

## Select tests from source

Read [the working PR draft](working-pr-draft.md) before choosing captures or logs. Its planned Proof section specifies the user actions, expected result and what each artifact must show. Reconcile those targets with approved checks/capture records, then update the matching draft rows after each actual result. The collector never overwrites PR.md or supplies publication approval.

First follow [Plan evidence a human can repeat](human-verification.md). Use wizard's scoping/journey method to plan role/data/setup, exact user actions, per-step expectations, before/after observations and linked artifacts for every case. Reuse the existing plan/capture contracts; record who actually executed the steps. The PR-writing stage turns those records into a human-reproducible walkthrough alongside supporting automated checks.

Trace the changed behavior, its callers and shared rules before selecting tests. Inspect the real assertions and relevant error/edge cases; choose the narrowest meaningful unit and regression commands already in the approved plan. Changing commands or the plan requires the existing review/approval process. Do not manufacture an approval, initialize a live run or execute a copied ticket's commands through this collector.

Execution keeps the delivery runtime's exact-plan fingerprint/approval, branch policy, clean bound workspace, Git identity, baseline, dependency and writer/verifier ownership gates. Collection requires these bindings too. Finish active selected-repository writers first; stale/missing evidence must be investigated rather than replaced by a prior pass.

## Scope JSON

Replace the example identities, paths, hashes and prose with actual approved values. The complete supported shape is:

```json
{
  "schema": "work-item-delivery.proof.v1",
  "plan_hash": "<current approved plan hash>",
  "repository": "<approved repository ID>",
  "environment": "local-fixture",
  "checks": [
    {"unit": "<unit ID>", "check": "<check ID>", "case_ids": ["<case ID>"], "kind": "unit", "format": "tap"},
    {"unit": "<unit ID>", "check": "<another check ID>", "case_ids": ["<case ID>"], "kind": "regression", "format": "jest-json"}
  ],
  "blast_radius": {
    "fact": "<one specific caller/shared-rule safety fact>",
    "checks": [{"unit": "<unit ID>", "check": "<check ID>"}],
    "references": ["<source path:line and relevant caller/rule>"],
    "risks": ["<remaining impact risk>"],
    "cleared": ["<why the named assertion discriminates the safety fact>"]
  },
  "observations": [
    {
      "kind": "automated", "executor": {"kind": "agent", "id": "<actual executor>"},
      "case_id": "<case ID>", "phase": "before", "environment": "local-fixture",
      "head": "<actual source commit SHA>",
      "expected": "<expected observable behavior>", "actual": "<observed result>",
      "artifact": {"path": "/absolute/private/before.log", "sha256": "<64 lowercase hex>", "bytes": 123},
      "test": {"path": "/absolute/private/test-snapshot.txt", "sha256": "<64 lowercase hex>", "bytes": 456}
    }
  ]
}
```

`environment` is `local`, `local-fixture` or `local-real-data`. `checks` must map every approved repository `{unit,check}` exactly once, including pending units. Each row has nonempty distinct known case IDs belonging to that unit. `kind` is `unit`, `regression` or `blast-radius`; `format` is `tap` or `jest-json`. Each check has one kind, so complete unit and regression evidence needs separate passing mapped checks. Membership is authored mapping, not observed behavioral coverage.

`blast_radius` and `observations` are optional; observation `test` and receipt `bytes` are optional. When blast radius is supplied, all five fields shown are required and its check references must exist in `checks`. Empty arrays are permitted but no referenced passing check leaves the fact unproven. Read the exact named test/assertion against the fact: `SUPPORTED_BY_CHECKS` establishes passing named checks, not semantic proof of the prose. Preserve remaining risks and cleared reasoning as authored judgments.

For product before/after proof, supply a separate `kind: product-action` observation for each phase and preserve actual failure/success artifacts. Automated and unclassified observations remain supporting evidence and cannot complete a case journey. Both phases use the declared environment; before must be an ancestor of current head and after must be current head. Record the test's exact identity/revision, preferably with the optional hashed `test` snapshot, so a changed test is visible. A setup exception does not reproduce the expected bug. Hash validation checks artifact bytes, not observation authenticity. Missing phases are explicit per-case acceptance gaps; they remain separate from execution `gaps`.

## Product-action records

The example above records supporting automation. A complete product-action observation additionally supplies `surface: ui|api|cli`, `outcome: observed|passed|failed|blocked`, executor, approved procedure binding and an execution transcript receipt:

```json
{
  "kind": "product-action",
  "executor": {"kind": "agent", "id": "actual-executor"},
  "surface": "cli",
  "outcome": "passed",
  "procedure": {"flow_id": "approved-flow", "sha256": "PROCEDURE-DIGEST"},
  "execution": {"path": "/absolute/private/execution.json", "sha256": "TRANSCRIPT-SHA256"}
}
```

Keep all original observation fields: case, phase, environment, tested head, expected/actual and artifact receipt. Compute the procedure digest with exported `procedureBinding(plan, repoId, caseId, flowId)` from `lib/evidence.mjs`. It binds the approved case/flow, cited source metadata/bytes and relevant capture definitions. A flow label alone cannot supply this identity.

The hashed transcript has schema `work-item-delivery.product-execution.v1`. It repeats `case_id`, `phase`, `environment`, `head`, `surface`, `outcome`, `executor` and `procedure` exactly. Its nonempty `actions` array records concrete `action`, `expected` and `actual` strings; at least one action matches the observation's expected/actual. CLI actions also contain actual `argv` as a nonempty string array, integer `exit_code`, `stdout` and `stderr`. API actions contain `method`, HTTP(S) `url`, `request`, integer `status` and `response`. Record the real invocation/request while doing the work, not an invented transcript afterward.

UI observations also supply `capture_id` and exact `capture_receipt: {path, sha256}` from the latest valid actual `recordCapture` receipt. That receipt must bind the same case, phase, head, environment, observed result/outcome and artifact. A foreign receipt, fabricated ledger wrapper or older pass after a later failure cannot qualify. API and product CLI journeys need no UI screenshot.

Before requires an observed/passed outcome; after requires passed. Failed/blocked records remain visible without closing the phase gap. Missing provenance is retained as unclassified supporting evidence; malformed explicit provenance is refused. Legacy observations never receive invented attribution. Test snapshots, current verification logs and recognized test-runner commands cannot be promoted into product execution by changing a label.

These checks bind authored records and bytes. They do not authenticate executor identity or independently certify the semantic result. UI receipt fixtures use synthetic screenshots in automated tests; only actual browser execution supports a real UI walkthrough. The same boundary applies to API/CLI transcripts and their stated environment.

## Read the result

The bundle contains private `evidence-index.json` and `proof-of-works.md`. Its first account is the product user's approved case: Work Item expectation and citations, role and starting state, actions/expected outcomes, capture procedure, then actual authored before/after observations linked to their artifacts. Automated commands, exits and runner counts support those case accounts. Pending units, blockers, failed/incomplete reports, absent unit/regression proof and unmapped cases remain execution gaps. Invalid/missing/changed logs or source bindings cause refusal.

The index also has `acceptance.status` and per-case `acceptance.cases[].gaps`. Missing before or after observations for one case cannot be supplied by another case's screenshot or a passing mapped check. CLI output exposes `acceptance` and `acceptance_gaps` separately from test execution `status` and `gaps`. Existing CLI exits still describe recorded test execution; exit zero with `acceptance: INCOMPLETE` is possible. `RECORDED_REQUIRES_REVIEW` establishes the presence of authored records, not product acceptance, successful human execution or screenshot coverage. Review the artifacts and actual case before composing a PR.

TAP accepts the completed Node TAP 13 report; Jest requires leading complete JSON from direct `jest --json`. Generic npm/shell chatter is not guessed into a report. Counts come from runner output: TAP nested totals are not top-level records or assertion counts; Jest counts reconcile with assertion statuses. Zero tests, skips/todos and contradictory/incomplete reports cannot establish a full pass. Exit zero alone never proves tests ran.

The collector rechecks log hashes/bytes, approved argv/exit headers, source head, fingerprint, dependencies and ledger/scope stability. This validates a snapshot; it is not a cross-run lock or independent certification of test quality, acceptance, SIT, deployment, model execution or human consent provenance.

## Outputs, reruns and sharing

Keep outputs outside every product checkout, including filesystem aliases. New directories/files use private permissions. Identical collection reruns preserve existing bytes; changed results need a new output directory. Preserve partial/conflicting bundles for inspection and choose a fresh directory. `--execute` always needs a fresh directory. Retain referenced private log/artifact bytes so later `--check` can validate them.

Review authored labels, paths and observations for privacy before sharing. The Markdown excludes raw logs/screenshots/test failure bodies; local links are not uploaded attachments. Use the existing capture workflow for UI evidence and `azure-pr-format` for the full PR. Follow existing exact-content approval gates before any ticket/PR publication; this tool supplies no publication approval.

The generated Markdown is a private evidence draft built from approved procedures and authored observations. Preserve it for `--check`; assemble the PR separately after reviewing the case meaning, observations, missing evidence, reviewer-accessible links and full-description length. Local artifact paths are not published PR attachments. See the human-verification guide for the writing step.
