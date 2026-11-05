---
name: work-item-align
description: "Work Item phase skill for a user correction or a missing decision. Records and scopes the correction and reconciles it with the plan, or shows the exact plan or payload awaiting approval and stops while the decision is missing."
---

# Work Item align

Run inside the [chain](../work-item-delivery/SKILL.md). The runtime card `docs/phases/align.md` is the contract.

## Missing decision

Show the exact rendered plan or staged payload and its hash, then wait. If the user already decided, record that decision with `approve-plan`, `approve-publication` or `approve-action` and continue. Silence, "investigate it", a timeout or an agent's vote is never approval.

## Correction

1. Write a local note with the user's exact words, the affected cases, paths, artifacts and assumptions, what stays valid, the current owner, and the next decision or check. Keep the instruction separate from your impact assessment.
2. Run `alignment-note --run RUN --file NOTE`, adding `--cases A,B` when the scope is known. Replacing the latest note needs its prior `--hash`; a stale hash means reread first. Use `--metadata-only` only after deliberately classifying the note as informational.
3. Run `alignment-resolve --run RUN --file REQUEST` with `{id, expected_revision, note_sha256, plan_hash, disposition, explanation, case_ids?}` taken from `resume`. `plan_hash` is `null` before a plan exists. Use `scope` to assess a pending note. Then resolve the selected open cases as `within-plan`, `adopted-plan` (the adoption must already be persisted) or `no-impact`. A pending note can instead be `no-impact` or `metadata-only`; a scoped correction is never closed as metadata. A resolution records your judgment and never edits or approves the plan.
4. Reconcile real artifacts before resolving. A material change uses `replan` at a safe writer boundary, renewed design where inputs changed, and approval of the exact revised plan. A copy edit within an approved recipe is `within-plan`. Preserve valid implementation, history and published identity.

Unknown scope holds new work whose independence is unproven. Scoped open cases hold affected new work and certification, including dependents. Active writers finish or park safely. Every open correction stays visible after later notes; a successful replan followed by an interrupted resolution leaves it open to retry. Before a plan exists, scope the note, then carry it into investigation and plan authoring.
