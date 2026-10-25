---
name: work-item-report
description: "Work Item phase skill for reporting, handoff and self-improvement. Reports case coverage, current-head evidence, PR links, holds and decisions needed, writes a scoped handoff, and runs reflect and correct after a non-trivial run."
---

# Work Item report

Run inside the [chain](../work-item-delivery/SKILL.md). The runtime card `docs/phases/report.md` is the contract.

1. **Reconcile.** Check active owners and current sources before claiming anything.
2. **Report.** Cover case coverage, environment, head, check and review status, PR links, blocked cases with owners, grouped holds and the smallest decisions needed. Keep planned, local fixture, human walkthrough, SIT and deployment evidence separate. A closed task or a passing fixture does not prove remote state. Use `pstack:teach` only to explain existing findings.
3. **Handoff.** Give the run and context hash, owner, next action and phase skill, plus the PR draft and evidence pointers. On Claude Code, the re-entry hook carries the run.
4. **Improve.** After a non-trivial run, run `pstack:reflect` on the session. When the same mistake class occurred twice, in this run or in the decision trail, run `pstack:correct`. It fixes the mistake as architecture, types, a check or a test before any prose rule, and proves the new check fails on the real mistake. Skill and rule changes are proposals for the user to approve, never applied silently.
5. **Trail.** Unattended or multi-phase runs keep one `pstack:show-me-your-work` decision trail.

Finish when the authorized acceptance predicate is observed or the pending boundary is clearly reported.
