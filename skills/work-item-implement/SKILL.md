---
name: work-item-implement
description: "Work Item phase skill for one approved unit. Locks its Red tests through a separate test author, then the writer turns them green in the bound repository with root-cause fixes and deslop, and records the finish receipt. Requires an approved plan."
---

# Work Item implement

Run inside the [chain](../work-item-delivery/SKILL.md). The runtime card `docs/phases/implement.md` is the contract, and the runtime refuses work without an approved plan.

1. **Readiness.** Refresh the tracker revision and live target refs. On drift, inspect the delta and `replan`; never silently rebase or keep stale assumptions. Rerun the design check before admitting a new writer.
2. **Workspace.** Create or reuse the approved branch in the repository's primary checkout and `bind` it. Use a linked worktree only when that checkout holds uncommitted work this delivery must not take, is on another branch, or has the branch checked out elsewhere. Claude Code: no `isolation: "worktree"`.
3. **Claim.** Run `next`, then `start --unit U --owner O`, which takes the single repository writer and emits the brief. Apply `pstack:principle-guard-the-context-window` to bound files, callers, tests, config and stop conditions.
4. **Red lock.** When the unit names Red tests, a test author other than the code writer writes them from the plan's assertions (Claude Code: `work-item-test-author`), when the session authorizes delegation. Otherwise write the Red commit before any production edit and record the single-agent limitation in the unit report. Run them and keep the failing output that shows the intended mismatch; an import or setup error is not Red. Commit them alone as `test(red): ...` and record that SHA and the paths in the unit report and PR draft. Without a practical seam, record why and use the closest useful check.
5. **Green.** The code writer makes the smallest complete change that turns the Red tests green. It fixes root causes (`pstack:principle-fix-root-causes`) and follows the cited conventions and the saved design contract. It never edits a locked test; a wrong test goes back through `work-item-align`.
6. **Tidy.** Record any missing before capture for UI cases and run focused checks. Apply `pstack:deslop` to the scoped diff and rerun affected checks after substantive cleanup. Keep required safeguards such as controller catches and boundary validation.
7. **Drive it.** Before finishing, exercise the change the way its user would: start the service and call the endpoint, or open the page and repeat the case (Claude Code: Claude in Chrome for this exploratory check). Fix what you find. Receipted before and after captures still come from Playwright in `work-item-verify`. An unexercised change is not finished.
8. **Finish.** Make focused case commits when authorized, then run `finish --unit U --owner O --evidence REPORT`. The report states the cause, the Red SHA with its failing-before and passing-after output, and the deslop result.

If a unit is blocked mid-change, keep ownership until its dirty or partial work is safely finished or parked under an explicit recovery plan; `block` refuses to release it. Never discard, relocate, cherry-pick or certify partial work. Keep other safe repositories moving. A delegated writer gets a fresh bounded brief (cases, sources, paths, Red SHA, checks, PR draft, return criteria) and returns a unit report. There is one writer per repository.
