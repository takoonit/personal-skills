# Investigate before admitting a plan

Start with [the human journey](human-journey.md) when explaining or testing this workflow. The commands below are agent/operator steps; the person supplies intent, reviews evidence and makes the required decisions in chat.

The host reads sources and dispatches investigators through its native tools. The runtime stores their inputs and reports before a developer plan exists. A new run requires a reconciled dossier, a v3 plan, checked design artifacts and the user's approval.

## Begin and resume

Write an investigation definition using [investigation.example.json](../templates/investigation.example.json). Assign each question a bounded evidence domain, case IDs, source IDs and assignee. Choose questions that could change acceptance or the proposed implementation. Do not embed a preferred fix or sibling conclusions in a question.

Use `independent-host` only when the host actually gives investigators separate initial contexts. Otherwise declare `single-agent` and explain the reduced independence. The CLI cannot authenticate agent identities, isolate contexts, prove semantic truth or verify remote freshness.

```sh
work-item-delivery investigate --run RUN --file investigation.json
work-item-delivery investigation-brief --run RUN --task acceptance
work-item-delivery investigation-brief --run RUN --task data-path
work-item-delivery cursor --run RUN
```

Each investigator receives its assignment, Work Item identity, assigned sources and an input hash. Source paths point to exact copied bytes. Initial briefs contain no sibling reports. The host runs only the authorized native tasks. No agent dispatcher, background process or second implementation scheduler is installed.

`status`, `next` and `cursor` work in absent, investigation-only, delivery-only and combined runs. When delivery state exists, its writer and approved-action rules retain control. Pending research is advisory until explicit admission through `replan`.

## Import reports and challenge the exact bundle

Use [investigation-report.example.json](../templates/investigation-report.example.json). Copy the issued `input_hash` and task ID. Each report has `claims`, `gaps` and `artifacts` arrays.

A claim records a statement, affected cases, cited sources and limitations. Its basis is `documented`, `source-supported`, `executed-test`, `observed` or `inferred`. Executed tests also require command, outcome and artifact IDs. Observations require an environment and artifact IDs. Inferences cite local premise claim IDs. An accepted inference requires accepted premises. A gap records the missing evidence, owner and observable `unblock_when` condition.

Artifacts have an ID and a local file path. Imports copy their exact bytes. Claims and gaps use task-qualified IDs after import, such as `acceptance/C1`. Every assigned case needs a claim or explicit gap.

```sh
work-item-delivery investigation-report --run RUN --task acceptance --file acceptance-report.json
work-item-delivery investigation-report --run RUN --task data-path --file source-report.json
work-item-delivery investigation-brief --run RUN --task challenge
work-item-delivery investigation-report --run RUN --task challenge --file challenge-report.json
work-item-delivery investigation-brief --run RUN --task arbitration
```

The challenger receives the exact completed investigator bundle and its hash. Its report contains `task: "challenge"`, that `input_hash`, `artifacts` and `challenges`. Each challenge has an ID, statement, case IDs, source IDs, limitations, claim IDs and a kind of `counterexample`, `missing-evidence`, `conflicting-authority` or `scope`. An explicit empty challenges array records a completed challenge. Missing reports do not count as completion.

A challenge defaults to case scope. Its cases and targeted claim/premise dependencies determine affected work. Set `scope: "source"` only for an explicitly source-wide challenge. A shared Work Item or specification citation alone does not broaden a case-scoped challenge to every consumer.

A narrow investigation can set `challenge.required` to false with a concrete `reason`. This waiver is retained in the reconciled dossier. It is a host judgment, not an inferred runtime exemption.

Identical submission bytes are idempotent. A conflicting report requires an explicit revised definition with the current `expected_revision` and a changed task `revision`. Changing source metadata, revision or bytes also revises its consuming tasks. An unchanged task/input retains its report. Changes clear challenge and arbitration. Use a changed `revision_note` to reopen arbitration while keeping unchanged investigator reports. A stale expected revision is refused.

## Reconcile evidence and bind a v3 plan

The arbiter receives the exact report and challenge bundle. Use [arbitration.example.json](../templates/arbitration.example.json). Every claim, gap and challenge requires exactly one disposition and an evidence-based rationale. The statuses are:

- `accepted` accepts a claim or records that a gap or challenge is resolved.
- `rejected` dismisses the record with a rationale.
- `unresolved` preserves the missing decision or contradiction.

Rationales are attributed human or agent judgments. The runtime checks completeness and bindings, not whether prose is true. Do not rank evidence by model votes.

Each binding names a unit, its claim IDs, optional gap IDs, case records, case IDs, source IDs, finding, finding status and acceptance array. The plan must match these explicit fields exactly. Rejected claims cannot support a unit. Bindings must include every source in the full inference premise chain; unavailable or conflicted sources block their consuming units. Unresolved records must map to blockers for every unit whose cases they affect. A blocker lists the qualified IDs in `investigation_refs`; a gap also requires the same owner and unblock condition. Gap-only units may have no claim IDs, but must name their gap IDs.

```sh
work-item-delivery arbitrate --run RUN --file arbitration.json
```

Put the returned `dossier` receipt into `plan.admission.dossier`. Each unit has `investigation.claim_ids` and optional `investigation.gap_ids`. The plan keeps the v2 business context, flow, test and browser-capture requirements. It uses schema `work-item-delivery.plan.v3` and adds absolute `design.manifest` and `design.models` paths.

## Check design, admit and approve

Complete the existing [design workflow](work-item-design.md) against the drafted v3 plan. The manifest's plan hash is the design context hash. It covers the plan and source receipts and is distinct from the final approval hash, which additionally binds manifest and model bytes.

```sh
work-item-delivery design-context --run RUN --file plan.json
node scripts/check-design.mjs --plan plan.json --file design.json --models models.md
work-item-delivery init --run RUN --file plan.json
work-item-delivery plan --run RUN
work-item-delivery approve-plan --run RUN --hash APPROVAL_HASH --evidence human-decision.txt
work-item-delivery start --run RUN --unit U1 --owner writer
```

Use the final hash returned by `init` or `status` for human approval. The runtime calls the existing checker at admission, approval and new-writer admission. It checks configured seats and raw artifact bytes without dispatching reviewers. The checker does not establish that a model actually wrote a report.

The executor brief includes admitted claims, premise evidence, limitations, source receipts, independence declaration and unit blockers. Investigation blockers and unavailable or conflicted source evidence need reconciliation and explicit replan before release. Execution blockers whose sources remain readable keep their existing receipt-based unblock path. Active writers can finish through changed or missing design metadata using their recorded approval, while source, scope, dossier, owner and path checks remain enforced. New writers and new approval still require current design artifacts. Unchanged publication and approved-action paths do not launch design panels.

## State ownership and revisions

`investigation.json` owns pending research. Sources, raw reports, normalized reports, prior manifests and reconciled dossiers are content-addressed immutable blobs under `evidence/sha256/`. Every import verifies an existing blob instead of overwriting it. The existing run lock serializes short imports and atomic manifest writes.

`delivery.json` alone records adoption through its plan. The investigation manifest has no adopted flag. A failed admission can leave unused blobs; it cannot replace the execution state. Status verifies collected partial reports and completed dossier evidence. Missing or corrupt bytes create an integrity hold without rebuilding or replacing evidence. A new pending dossier does not revoke an existing plan or approved action.

Replan requires the existing safe writer/verifier boundary. Whole-plan approval changes independently of versioned implementation inputs. Those inputs retain substantive claims, premises, scoped challenges, decisions, artifacts and source closure. Rewritten disposition rationale and unrelated report envelopes remain provenance without resetting unchanged consumers. Substantive changes reset affected units and downstream dependents. Unaffected implementation remains recorded. Legacy preservation requires comparable historical inputs and records its evidence limits. Grouped PRs and sealed scope retain their existing rules.

Fresh v1 and v2 initialization is refused. Persisted legacy runs remain readable and continuable without manufactured evidence. Identical legacy replans preserve approval. Material legacy changes require v3 admission. A legacy migration that would change sealed repository evidence is refused; use an explicit follow-up run for that scope.

Implementation identity migration results remain visible in `status` and `resume` as `unit_input_migrations` and `unit_input_migration_gaps`. Retained historical work does not acquire retroactive investigator attestation. Design reuse has a separate bounded [v2 origin-plan contract](work-item-design.md#reuse-after-operational-changes); a preserved implementation does not imply reusable design review.

## Work Item revision and per-case sources

The current Work Item revision remains exact approval/admission context. Its global revision counter is not itself a behavioral change to every case. New investigation runs default to task identity v2; implementation identity v3 and v2 task inputs exclude only this counter from semantic identity; Work Item ID/type/URL and unknown fields remain substantive. Sources still bind their actual revision and bytes.

For independently changeable cases, save separate cited section snapshots with explicit section boundaries and a stable verified section digest/version. Keep the freshly observed whole-item revision in `work_item.revision`; do not label a section digest as a server revision. A coordinator must compare the extracted section from the new item and retain provenance for that extraction. A whole-ticket snapshot is still valid, but a byte/revision change conservatively invalidates all its consumers. This workflow does not infer unchanged sections from a claim that an edit was unrelated.

Unmarked task definitions retain the historical full-revision input formula for receipt verification. An existing definition keeps its old task format, including an absent legacy version field, by default while the full Work Item identity is unchanged, preserving unaffected reports when a task or sibling source changes. A changed Work Item identity defaults to v2, or the caller can explicitly choose `task_identity_version: 1` or `2`. Moving v1 to v2 needs fresh reports once; later v2 rounds can reuse unchanged section/task reports across global revision changes. Stored implementation identities migrate only after their old formula and historical inputs are verified. Migration preserves original report context and records limits; it never relabels an old report or supplies new approval. Changed admission/dossier remains substantive for design reuse under the bounded design contract.
