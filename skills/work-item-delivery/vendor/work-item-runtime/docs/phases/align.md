# Reconcile a correction or a missing decision

**Input:** new user correction, pending assessment or scoped open correction, current owner/plan/approvals and evidence pointers. Ordinary await-human remains a separate missing-decision case.

**Read:** [full plan/replan policy](../delivery-rules.md#plan-and-approval), [execution preservation](../delivery-rules.md#approved-execution-and-handoff), and [approval to action](../playbook.md#approval-to-action). Read the affected phase's cited policy only.

**Skills:** choose again from the available existing skills for the affected question after reconciliation. A correction is not permission to continue the previous skill by habit. Unchanged already approved actions keep their execution route.

**Action:** for a correction, follow steps 1-4 below. Ordinary await-human needs only the exact required proposal and actual decision. Display it, wait if missing, or record an already supplied decision. It requires no fabricated note.

1. Write a local note with the exact user correction/source, affected cases/paths/artifacts/assumptions, what remains valid, current owner and next decision/check. Separate the user's instruction from the coordinator's impact assessment.
2. Record `alignment-note --run RUN --file NOTE`. Intake durably creates pending assessment. Supply `--cases A,B` for known case scope. Replacing the latest note requires its prior `--hash`; a stale hash requires rereading. Use `--metadata-only` only after deliberately classifying a note as informational. Every correction remains in the registry after later notes arrive.
3. Use `alignment-resolve --run RUN --file ASSESSMENT` to scope pending work or reconcile selected cases against the actual current plan. Inspect the command contract in the CLI reference. Coordinator assessment needs no human approval and grants none. Unknown scope holds new admission whose independence is unproven. Scoped open cases hold affected new work and certification, including dependent units. Existing owners can finish or park safely; already authorized native actions retain their bounded route.
4. Reconcile actual plan, source/evidence and publication drafts before recording resolution. Material changes use safe-boundary replan, justified design renewal and exact revised plan approval. A successful replan followed by an interrupted resolution leaves the correction open for retry. Copy edits within an approved recipe can be recorded as within-plan reconciliation. Revised external payload still needs exact changed-content approval. Preserve valid implementation, historical evidence and sealed publication identity. Resume and read the newly selected phase card and skills.

**Output:** archived note, every pending/open correction and its affected scope, actual reconciliation evidence or a precise remaining hold, retained-valid work and chosen route. For ordinary await-human, return the displayed exact proposal and actual decision or missing-decision boundary.

**Stop/return:** for await-human, show the exact rendered plan/payload and wait only while the required real decision is missing. Record an already supplied decision and continue. For a blocked active writer, preserve ownership until safe finish/parking. Return with evidence and smallest unblock condition; do not label a note automatically resolved.

Resolution request example, using current values from `resume`:

```json
{
  "id": "correction-ID",
  "expected_revision": 1,
  "note_sha256": "EXACT-NOTE-SHA256",
  "plan_hash": "CURRENT-PERSISTED-PLAN-HASH",
  "disposition": "scope",
  "case_ids": ["A", "B"],
  "explanation": "Both cases depend on the clarified rule."
}
```

The preplan hash is explicitly `null`. Every request binds the note and current plan/revision. After `scope`, resolve selected open case IDs with `within-plan`, `adopted-plan` or `no-impact`; siblings stay open. `adopted-plan` requires actual prior adoption and a plan hash different from intake. Pending notes can instead be classified `no-impact` or `metadata-only`. A scoped correction cannot be blanket-closed as metadata. An exact latest-request retry converges; stale requests fail. A resolution records coordinator judgment, not proof of its semantic adequacy.

Before a plan exists, assess a pending note's scope first, then continue the investigation/challenge/arbitration/plan-authoring route with the scoped correction in its packet. Scoped cases cannot be resolved against a plan that does not exist. Preplan case IDs receive syntax validation; reconcile their actual membership when drafting/admitting the plan. If a later plan replaces an old case ID, selected open historical IDs can be resolved as `no-impact` with an explicit current-plan-bound explanation. This records why they no longer affect the plan; it does not rewrite history or grant approval. Current-plan `within-plan` and `adopted-plan` dispositions still require current known cases.
