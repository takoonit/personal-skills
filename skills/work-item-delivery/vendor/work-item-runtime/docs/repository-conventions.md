# Repository readiness and conventions

This is the default for each new Work Item, not authorization to clean unrelated work. The current user's instructions and the affected repository's applicable instructions take precedence over shared workflow defaults. A repository exception must be explicit and cited; a dirty checkout or habitual practice is not evidence of an exception. Do not copy the backend repository's backend rules onto the frontend repository or another repository with its own rules.

## Clean start

Before investigating the working source, read applicable root and nested agent instructions and inspect the repository with its native Git. For Ubuntu repositories, run Linux Git through WSL, including from Windows clients.

1. Record the repository/remote identity, current branch and HEAD, configured target ref and live target SHA, and existing worktrees. Refresh the remote target without switching or modifying the working tree. Use the configured repository and target unless repository instructions or directly read evidence require a change; explain any change in the plan.
2. Inspect staged and unstaged diffs and untracked paths. A clean Git status means no staged, modified or untracked files; legitimate ignored environment files, dependencies and caches do not by themselves make it dirty. Inventory suspicious ignored output selectively instead of treating every ignored path as disposable.
3. Preserve existing work, local configuration, hooks, secrets and other worktrees. Do not automatically stash, reset, delete, move configuration out of service, commit someone else's work or add blanket ignore rules to manufacture a clean status. Read-only investigation may continue against the recorded clean baseline while working-tree contamination is reported as a blocker.
4. Put the status result, baseline/source identity, the checkout that will be bound, and any explicit repository exception in the developer plan. After approval, create the branch in the repository's primary checkout and bind that path. Recheck it immediately before edits. Add a linked worktree only when that checkout cannot be the writer: it has uncommitted work this delivery must not take with it, it is on another branch, or Git already has the branch checked out elsewhere. Ignored dependencies and caches are not that uncommitted work. A clean checkout already on the baseline does not need a worktree. Ask about ownership/disposition only when a necessary action cannot be resolved from existing authorization and repository policy.
5. Apply an explicit repository exception where it changes this default and record its source/section, scope, rationale and effect on verification. The runtime's existing clean-writer check still applies to whichever directory is bound. Reconcile an unsupported policy in the reviewed plan rather than silently bypassing a gate. Report an actual failed readiness check as a blocker, not as successful preparation.

## Repository-specific sources

Read each owning repository's live AGENTS.md and its convention index before selecting patterns. Preserve cited snapshots/revisions in the approved plan. Do not substitute this generic package for product architecture, transport, transaction, logging or testing rules.

## Make conventions reviewable

Use the existing plan schema rather than adding an unvalidated checklist. Preserve each relevant instruction/convention source in `sources` with a locator, exact revision, section, read status and snapshot. Link it through the affected unit's `source_refs`, explain its design/impact in `change` and `acceptance`, and map checks into `checks` and `unit_test_plan`. The existing source fingerprint makes a changed cited convention invalidate the old approval.

The displayed developer plan and final standards review must identify: source/section, applicable rule, affected paths/behavior, actual check/evidence or justified non-applicability, and any explicit repository exception. Writers receive those source references in their brief. Review the final head against the same sources, and replan when a changed convention alters the approved work. Do not certify a rule merely because this guide names it.
