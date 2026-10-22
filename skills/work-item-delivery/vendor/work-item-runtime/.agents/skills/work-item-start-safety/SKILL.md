---
name: work-item-start-safety
description: Check readiness before starting an Azure DevOps Work Item, require a reviewable developer plan with realistic time ranges, and verify the shared workflow's approval, workspace and writer guards.
---

# Work Item start safety

Use with the global `work-item-delivery` skill before a new ADO Work Item and before resuming implementation after relevant changes. Investigation can proceed read-only. Product branches, code, tests and configuration require the user's approval of the exact current developer plan.

The property: implementation admission requires a matching approved plan, ready evidence and dependencies, a valid clean bound workspace, and one active writer for that repository within the same delivery run. Breaking it can start the wrong work, overwrite another writer's work, or execute an unapproved solution.

## Before the developer plan

Follow the shared [playbook](../../../docs/playbook.md), [repository readiness rules](../../../docs/repository-conventions.md), and [business evidence contract](../../../docs/business-evidence.md). Reuse their schema and receipts. Keep runs, captures and generated evidence outside product repositories.

Check and report these facts for the actual Work Item:

| Check | Evidence needed before implementation |
| --- | --- |
| ADO scope | Directly read ID, type, current revision, acceptance criteria, every reported case, relevant discussion, existing tasks, parent and related links. Record access gaps. |
| Business meaning | Read the applicable versioned requirements and business/UI flows through the configured research tools. Resolve conflicting authorities or name the decision owner and affected blocker. |
| Repository | Read applicable instructions and conventions; trace affected request/UI/service/data/response paths and callers. For defects, distinguish reported behavior, reproduced behavior, supported root cause and hypotheses. |
| Workspace | Record actual branch, HEAD, server target SHA, ancestry, worktrees, staged/unstaged/untracked changes and existing owners across other delivery runs and agents. The runtime excludes writers within one run only; resolve cross-run conflicts before edits. Preserve existing work. A local remote-tracking ref alone is insufficient evidence of the server target. |
| Evidence and tests | Map each case to sources, before captures where applicable, executable behavioral unit tests or a justified exception, after evidence and QA/SIT owner. Failed or unavailable evidence stays a gap. |
| Dependencies | Separate implementation, verification, publication and deployment dependencies. Name blockers, owners, observable unblock conditions and work that can proceed independently. |
| Estimate | Include the ranges and assumptions below in the plan shown to the user. |

Missing requirements or access do not imply an empty result. Hold affected implementation and continue useful independent investigation. Do not create or change ADO fields, comments, attachments or links without showing their exact proposed content and obtaining the user's approval.

## Realistic time estimates

Estimate after tracing the scope and checking the available environment. For each execution unit, show:

- **Active AI execution:** a range covering implementation, relevant tests, evidence gathering and expected correction/review work. Explain the range using affected flows/repos, reproduction difficulty, known reusable patterns, test setup and unresolved uncertainty.
- **Human effort:** separately identify code review, decisions and QA/SIT work, with owner and a range only when supported. Otherwise say the owner must estimate it.
- **Waiting and release:** separately identify access, external decisions, environment availability, deployment windows and other queue time. Use an explicit dependency or unknown range instead of promising a completion time while blocked.
- **Confidence and assumptions:** state what is known, what could expand the estimate, and what investigation would reduce the range. Base ranges on comparable observed work when available; avoid minute-level precision without evidence.

Use a compact plan table: `unit/cases | active AI range and basis | human effort/owner | waits/unblock condition | confidence/assumptions`. Show elapsed delivery as the dependency critical path plus waits; do not sum work that can run concurrently. State execution resources assumed. Include integration and shared review once, where they actually occur. Revise estimates when findings change and explain the cause; show material scope/solution/baseline changes for renewed approval.

Estimate quality is a human judgment requirement. The runtime and checker do not enforce realism or certify a completion date. Without a concrete Work Item, provide this estimation method without inventing an item-specific number.

## Approval and start

Automatically show the full developer plan in chat, including all cases, findings/uncertainty, solution and rationale, affected repositories/paths, target baseline and proposed branch, dependencies/blockers, test/evidence gates, QA/SIT ownership, estimates and publication holds. Wait for explicit approval of that version. Never manufacture a consent receipt.

Use the existing `work-item-delivery` commands and `cursor` action. Immediately before approved branches/edits, refresh source revisions and server target refs and recheck workspace/ownership. Reconcile changed scope, baseline, sources or solution through `replan` and renewed approval. Resume unchanged approved work using its existing receipt. A failed runtime gate is a hold to resolve, not permission to bypass it.

## Check the workflow guards

Run this when changing the covered shared workflow, or when a start-gate regression is suspected. It is an offline software check; a pass does not establish that a particular live Work Item is ready or approved.

Ubuntu:

```sh
cd $WORK_ITEM_DELIVERY_ROOT
python3 .agents/skills/work-item-start-safety/scripts/check.py
```

Native Windows PowerShell:

```powershell
wsl.exe -d Ubuntu-24.04 -- bash -lc 'cd $WORK_ITEM_DELIVERY_ROOT && python3 .agents/skills/work-item-start-safety/scripts/check.py'
```

Requires Python 3, Node 22+, and Java or working Ubuntu Docker. The script uses checksum-pinned TLA+ tools release 1.7.4 and a pinned Java container with networking disabled. It downloads the official jar only if absent; Docker may need to retrieve the pinned image if not cached. Proof logs go under `~/.local/share/work-item-delivery/verification/work-item-start-safety/`.

For a deliberate failure demonstration, add `--self-test`. This changes temporary copies only, checks five real-code mutations and four model mutations, and then rechecks the original. No live ADO or delivery run is initialized, approved or started. Synthetic test approvals are fixtures, never user consent.

## Coverage and interpretation

Read [findings and limits](references/findings.md) before interpreting a pass. [coverage.json](coverage.json) identifies the source snapshot; [checks.json](checks.json) lists all required actual-code tests. The export records its source workflow commit and exact packaged file hashes; those hashes identify the adapted snapshot, including originally untracked files. A source commit alone does not identify that snapshot.

| Check | Actual source boundary |
| --- | --- |
| Approval/schema/source binding | `lib/delivery.mjs`: `fingerprint`, `requireBranchPolicy`, `requireApproval`, `start`; `lib/evidence.mjs` |
| Readiness/evidence/dependencies | `lib/delivery.mjs`: `readiness`, `start`; `lib/evidence.mjs` capture coverage |
| Valid clean workspace | `lib/delivery.mjs`: `workspace`, `start` |
| One writer per repository within one delivery run | `lib/delivery.mjs`: `locked`, `start`, `readiness`; `vendor/pstack/store.mjs` |
| Next-action advice | `lib/cursor-workflow.mjs`: `nextCursorAction`, all 16 intake/approval/writer/readiness combinations |

[WorkItemStart.tla](model/WorkItemStart.tla) checks two units in one repository within one delivery run, two plan revisions, all eight initial schema/readiness/workspace combinations, and interleavings of approval, readiness, workspace checks and persistence under the cooperating runtime lock. TLA+ suits the ordering question; actual-code tests establish the concrete guards and source-binding behavior.

The model assumes external facts remain stable during each locked callback. The lock coordinates commands on one run/store; separate delivery runs, external Git, source edits and ADO changes can bypass it. Cross-run writer exclusion is not implemented by these guards and requires the ownership check above. This is admission safety at the checked boundary, not continuous validity after edits. It does not prove external TOCTOU safety, human approval provenance, requirement correctness, live ADO/server freshness, estimate accuracy, liveness, crash recovery or deployment/SIT outcomes.

`DRIFT` means the recorded source snapshot changed: inspect the changed source and model/test correspondence before trusting results. A behavioral assertion or model invariant failure is a finding until diagnosed. A missing tool, timeout or skipped required test is an incomplete check. Do not weaken a property or change product code merely to make verification pass.

Use `pstack:maintain-formal-verification-skill` when covered code changes. Reconcile each guard, the model's atomicity assumptions, generated cases and deliberate failure checks; run normal and self-test modes before updating hashes. Set a real sync commit once one exists and is inspected. Never refresh hashes alone to conceal a mismatch.
