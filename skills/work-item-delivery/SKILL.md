---
name: work-item-delivery
description: "Run the local pstack-based system for a multi-case Work Item: read tasks/specs, investigate flows, identify blockers and dependencies, automatically show the developer plan for approval before coding, then carry approved scope through implementation, tests, review and PR read-back. Use when asked to evaluate, plan or deliver a Work Item; advice and PR copy editing alone do not start a delivery run."
---

# Work Item Delivery system

Read [setup and prerequisites](references/setup.md) for a fresh installation. This skill includes a vendored runtime at `vendor/work-item-runtime`, resolved relative to this file. Derive its absolute path before running commands; do not assume environment variables or the source author's machine paths exist.

Default for every new Work Item: investigate and draft the plan, run the design stage below, automatically show the resulting concrete developer plan in chat, then wait for explicit user approval before creating product branches or editing product code, tests or configuration. The user does not need to request the plan or add "before coding". Do not ask whether they want a plan; prepare and present it. A request to fix or deliver a ticket is permission to investigate and plan, not approval of an unseen plan.

Apply [Work Item start safety](../work-item-start-safety/SKILL.md) during intake and before implementation. Include its realistic per-unit time ranges, assumptions and confidence in the developer plan, separating active AI work, human effort and external waits. Its offline workflow check does not certify live Work Item readiness or replace user approval.

This skill is the entry point to an executable, durable workflow system. Its runtime and playbook are at `vendor/work-item-runtime`; its installed CLI is `work-item-delivery` at the installer-selected bin path. Resolve the runtime relative to this skill directory; use Linux or WSL Bash. This skill does not install pstack's Cursor mode, choose new models, authorize subagents, or alter existing delivery rules.

For a native Windows session, first read [Windows access](references/windows.md). It gives WSL invocation, Windows-readable reference paths and path conversion rules; the workflow and approval gates below still apply.

For an advice or system-design question, explain the system without starting a run. For a concrete Work Item request, read the [system playbook](vendor/work-item-runtime/docs/playbook.md) before intake.

Use [investigation-to-spec guidance](vendor/work-item-runtime/docs/work-item-spec.md) to route `pstack:how`, `pstack:why` and `pstack:teach`, reuse their findings in `mattpocock-skills:to-spec`, and render a local spec plus exact ADO publication preview with `scripts/draft_spec.py`. Confirm the proposed testing seam and obtain exact-content approval before any tracker write. Keep realistic estimates and implementation holds in the developer plan. For jobs the user leaves running, also apply `pstack:figure-it-out` and `pstack:show-me-your-work` for verifiable units, checkpoints, one decision trail and independent review. This does not start a scheduler or bypass any approval gate.

Mandatory after the draft plan and before building: follow [Design before building](vendor/work-item-runtime/docs/work-item-design.md). Run `pstack:architect`, which runs `pstack:arena` once with the configured architect runners, then run `pstack:interrogate` on the exact selected sketch and rationale. Resolve lead-classified Act On findings before implementation; do not automatically apply reviewer suggestions. This overrides architect's default auto-implementation. Use `scripts/check-design.mjs --plan PLAN --file MANIFEST --models CONFIG` to validate current plan/configuration bindings, configured seats, raw artifact bytes, selected-design associations and finding dispositions. Include design/review effort in realistic ranges. Show the final plan with accepted design changes and obtain genuine explicit approval; changed full inputs require renewed design/review, not relabelled old reports. This is an agent-workflow gate; direct CLI calls and edits bypassing the skill are outside its enforcement.

Follow [diagnosis and coding discipline](vendor/work-item-runtime/docs/work-item-design.md#diagnosis-and-coding-discipline): for bugs, apply `pstack:principle-fix-root-causes` during investigation; before coding each approved unit, apply `pstack:principle-guard-the-context-window`; use the user's conditional `pstack:tdd` request when the code change has a matching cheap project test seam, retaining the actual intended failing-before and passing-after evidence. Otherwise record why it is impractical and use the closest useful check. After coding and before `finish`/handoff, apply `pstack:deslop` to the scoped diff and rerun affected checks after substantive cleanup. Preserve required repository safeguards, including controller catches and boundary validation. Include these steps in the existing realistic review/correction estimate; none bypasses plan approval.

## Cursor workflow

Do the intake and investigation below until `init` succeeds. After that, the next step is only the action printed by:

```sh
work-item-delivery cursor --run RUN
```

Perform that action, then run the command again. Before carrying out `start-unit` or creating product branches/edits, rerun the mandatory design check above alongside normal readiness. Missing/stale/incomplete design evidence holds the agent even if Cursor advises a start. `await-human` ends the turn: show the rendered final plan or the staged publication hash and wait. Record `approve-plan` or `approve-publication` only from the user's decision, never from an agent-written approval file. `continue-writer` keeps the dirty repo with its owner; preserve already admitted work through safe finish/parking, then apply the new gate at the next safe unit boundary. The command does not edit code, call Azure DevOps, or publish.

 Discover and use the configured Azure DevOps MCP server first; follow [harness adapters](vendor/work-item-runtime/docs/harnesses.md) for tool discovery, persistent sessions and bounded fallback. Use only actual available tool schemas. The [README](vendor/work-item-runtime/README.md) owns CLI behavior and receipt formats; inspect `work-item-delivery help` when needed. Read [local discovery defaults](vendor/work-item-runtime/config.json) rather than guessing repo paths or tracker configuration.

## Intake and analysis

First apply [repository readiness and conventions](vendor/work-item-runtime/docs/repository-conventions.md). Start from a clean, current baseline by default, unless the affected repository explicitly says otherwise. Read its applicable instructions before cleanup or convention selection; they override shared workflow defaults, subject to the user's instructions. Record dirty/staged/untracked work and existing worktrees without discarding, automatically stashing or relocating it. Show the clean-start result or the exact repository exception in the developer plan. Use the backend repository's live `docs/conventions/` sources for its backend; other repositories retain their own conventions.

Business context and evidence are required stages. Read the [business/citation/capture contract](vendor/work-item-runtime/docs/business-evidence.md): apply SecondBrain `wiki-query` (and `think` for consequential ambiguity), read versioned Confluence business/UI/process sources, and use the installed Playwright skill for investigation before captures and current-head after captures. A missing source or failed capture stays an explicit gap. New plans use v2 research, cited business-flow and capture fields; the runtime holds affected work/publication when evidence is missing.

1. Directly read the owning Work Item, its acceptance/expected behavior, numbered cases, relevant discussion, existing child tasks and parent/related links. Record revisions and preserve exact snapshots with `intake`. Keep one QA report; use local case IDs where no child task exists.
2. Link every case to the directly read spec version/section and existing tasks. Preserve missing access, competing requirements and the source authority decision. Hyperlinks go into the local plan; tracker mutations require their own exact-content approval.
3. Read repo instructions/foundations and applicable convention sections, then trace how each case works through UI/request/service/data/response as applicable. Preserve convention sources with their revision/section/snapshot in the existing plan `sources` and affected units' `source_refs`; map each applicable rule to the proposed change and verification or an explicit repository exception. Separate reported behavior, code findings, hypotheses, observed reproduction and deployment evidence. Stay within the reported cases and real dependencies.
4. Identify unsafe unknowns and blockers early. Record affected units, evidence, owner and observable unblock condition. Keep ready investigations moving while a decision/access issue is pending.

## Plan and approval

Build a plan using the [example schema](vendor/work-item-runtime/templates/plan.example.json), replacing every fictional value and command with live evidence. Store the run/evidence outside product source control. The runtime validates cases, source links, repo grouping and dependency cycles.

Keep generated logs, captures, analysis output and scratch runs in the external run directory. Reuse configured/global skills instead of copying tool bundles into multiple product-repo agent folders. Before cleanup, inventory tracked/untracked/ignored content; preserve real source/tests, local configuration and Git worktrees. Archive useful historical evidence outside the repo and remove only identified disposable output. A stash is recovery storage, not a substitute for classifying repository clutter; never use blanket `git clean -fdx` or discard a mixed-work stash to hide it.

Use one branch and one grouped PR per owning Work Item per affected repo under the reported team policy. Mixed feature/fix/change/chore work keeps focused case commits on that branch. Execution units are smaller than PRs. Distinguish implementation, verification, publication and deployment prerequisites; sharing a file is a coordination issue, not automatically a functional dependency. Pin verified baselines and proposed branch/commit order.

Record the directly read Work Item `type` and resolve branch policy before proposing or creating its branch. Configured Bug deliveries use `fix/<work-item-id>-<slug>`; do not substitute the generic `codex/` fallback. For other types, resolve the repository/user rule explicitly. The CLI shows the type/branch and checks the configured prefix at approval and execution/publication gates. Correcting an unpublished branch name requires explicit user evidence, the same clean recorded source head and `replan --evidence`; renew plan approval/checks/review. Do not rename a published PR branch through this recovery path.

Render `plan` and present the developer plan in the user-facing chat, not only in a file or tool output. Cover all reported cases; explain the problem, supported root cause or remaining uncertainty, proposed solution and reasons, affected repos/files/behavior, target baseline and exact branch, dependencies, blockers, unit tests, before/after evidence, QA/SIT ownership, and realistic execution estimates with reasons. Include the case/task/spec map, ready order and publication holds. Only after showing this concrete plan, wait for explicit approval and capture the actual decision with `approve-plan` before branches or code. A changed scope, baseline or solution requires showing the revised plan and renewed approval; a resume of unchanged approved work uses the existing approval. The approval receipt records the user's decision; the agent must not manufacture consent.

Make unit tests and evidence gathering explicit completion gates in every developer plan: per-unit `unit_test_plan` names executable check IDs, behavioral assertions, failing-before and passing-after proof (or a justified non-applicability reason). The CLI renders these details and refuses new approval when they are missing. Follow the [test/evidence completion contract](vendor/work-item-runtime/docs/business-evidence.md#test-and-evidence-completion-gates) for required artifacts and ownership. Show active AI execution estimates separately from human effort and waiting time. A user-owned QA/SIT stage is a handoff obligation, not a reason to demand developer SIT access; use labelled local verification where authorized.

A blocked case can hold its repo's PR even while independent cases are implemented. State that explicitly. Propose a policy exception before coding when necessary and wait for the owning decision; this system cannot promise that ordering eliminates all blockers. Existing published PRs are not reorganized by starting this workflow.

## Approved execution and handoff

Use `bind`, `next` and `start` for the approved workspace and exclusive repo writer. Native agents/tools perform the actual changes; delegation requires the session's authorization. Brief writers with all scoped cases, source/spec links, upstream outputs, paths, acceptance and exact checks. Keep independent repos progressing when safe.

Recheck repository readiness immediately before creating the approved branch and starting edits. Keep the clean-start default and convention exceptions tied to the affected repository's actual instructions. Create the branch in the primary checkout and bind that path. Add a linked worktree only when that checkout cannot move: uncommitted work this delivery must not take with it, another current branch, or the branch already checked out elsewhere. The runtime refuses a dirty bound directory. Do not bypass a runtime gate to implement an exception: reconcile the approved plan and supported runtime policy first. Carry the cited conventions into the writer brief and final standards review, recording actual checks and justified non-applicability.

Capture appropriate before/after evidence, implement using repo conventions and finish each case with scoped commits when authorized. Use `finish` to externalize the source/report. If blocked midway, retain repo ownership until dirty or partially committed work has an explicit safe recovery/isolation plan. Never silently discard, relocate or certify partial work.

Refresh source revisions and remote target refs at start/integration boundaries. A local remote-tracking ref does not prove that the server has not advanced. Reconcile changed assumptions and `replan`; do not silently rebase or retain stale approvals. `verify` runs real approved commands and binds output to the current source head. Collect final standards/specification reports and `review` that exact head, with independent reviewers when authorized.

Apply the available PR-writing skills to the three-section team format and per-case evidence. `stage-publication` freezes the exact repo, branch/head, text, work-item associations and attachment content. Obtain real user approval for its hash, execute only that native forge action, then directly read back the PR and remote attachment bytes. Preserve raw read-back and pass its normalized form to `published`. Publication is separate from merge/deployment and from tracker-field edits.

Use [Proof of Work](../proof-of-work/SKILL.md) to run approved unit/regression checks or validate existing evidence and draft the PR's Proof of Works section. Its shared operator recipe uses `pstack:swarm` when independent repository verification or read-only evidence review improves quality or speed, with isolated resources and independent bundle checks. Test passes do not certify authored case coverage, acceptance, SIT or deployment.

## Resume and report

Reuse the existing run directory. `status` reconstructs ready work, blockers, active ownership and per-repo publication holds from durable state. Reconcile interrupted agents before replacing owners. `recover-verification` clears only a dead verifier with a recovery receipt; rerun checks afterward.

Report actual case coverage, eligible next work, blocked cases/owners, current-head evidence, PR links and decisions needed. Readiness and delivery claims come from current receipts and direct source reads, not conversation memory. Do not claim a live integration was tested when only local fixture tests were run.
