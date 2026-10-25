---
name: work-item-investigate
description: "Work Item phase skill for intake and investigation. Reads the Work Item, specs and code, runs independent investigators, challenges and arbitrates them into a reconciled dossier, and starts the PR draft. Never edits product repositories."
---

# Work Item investigate

Run inside the [chain](../work-item-delivery/SKILL.md). The runtime card `docs/phases/investigate.md` is the contract. Stay read-only against product repositories and the tracker.

1. **Run.** Reuse the existing run directory, or create one outside every product repository. Keep runs, logs and captures out of product source. Read the runtime `config.json` discovery defaults rather than guessing repository paths or tracker settings. Reuse installed skills; never copy tool bundles into product-repo agent folders.
2. **Intake.** Read the Work Item directly, configured Azure DevOps MCP first (`docs/harnesses.md`): revision, type, acceptance, discussion, attachments, parent, child tasks and related links. Enumerate every reported case with QA's numbering. Map tasks to cases many-to-many; use local case IDs when no task exists. A task mentioning a case does not change that case's acceptance. Follow linked specs to the exact version and section, search boundedly when a link is missing, and record what was searched and whether it was read, unavailable, conflicting or only a candidate. Preserve snapshots with `intake`, without credentials or unnecessary personal data. Missing access is a gap with an owner, never an empty Work Item.
3. **Readiness.** Apply `work-item-start-safety` and `docs/repository-conventions.md`: repository instructions, the live target SHA, worktrees, and staged, unstaged and untracked work. Never stash, reset or clean to produce a clean status.
4. **Business context.** Use SecondBrain `wiki-query`, with `think` for conflicting meaning, and versioned Confluence sources. For each case, cite actor, trigger, preconditions, action, rule and outcome (`docs/business-evidence.md`). Take the before capture for UI cases with the browser skill.
5. **Trace.** Use `pstack:how` for the flow, `pstack:why` for rationale and `pstack:principle-fix-root-causes` for bugs. Follow the user's action through UI, request, validation, service, data and response, and reproduce before naming a cause. Keep reported behavior, code findings, hypotheses, reproduction and deployment evidence separate; a copied requirement is not implementation evidence. Park unrelated findings.
6. **Independent investigation.** Write the definition (`docs/investigation.md`) with neutral questions that could change acceptance or the fix, with no preferred fix and no sibling conclusions. Issue each `investigation-brief` and dispatch them in parallel to fresh workers (Claude Code: `work-item-investigator`). Import each report with its issued input hash. Send the challenge brief to a challenger (`work-item-challenger`), then arbitrate every claim, gap and challenge yourself. Record `independent-host` only when workers had separate fresh contexts; otherwise record `single-agent` and its limitation.
7. **Blockers.** Each unsafe unknown names its affected units, evidence, decision owner and observable unblock condition. Keep independent cases moving.
8. **PR draft.** Run `pr-draft --run RUN --repo REPO` once a repository is known, and write What Happened now.

A report missing its input hash or an assigned case is dropped and its worker rerun once; a second miss is a gap. Done when every case maps to expected behavior, sources with revision and section, its tasks or their absence, and a reconciled dossier or explicit gaps.

Read when needed: `docs/investigation.md` (schemas), `docs/business-evidence.md`, `docs/work-item-spec.md` (spec requests).
