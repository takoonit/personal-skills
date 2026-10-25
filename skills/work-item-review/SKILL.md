---
name: work-item-review
description: "Work Item phase skill for exact-head review. Reuses an accepted review that covers unchanged inputs, or sends fresh standards and specification reviewers who did not write the code, then dispositions every finding."
---

# Work Item review

Run inside the [chain](../work-item-delivery/SKILL.md). The runtime card `docs/phases/review.md` is the contract.

1. **Reuse first.** An accepted completed review that covers unchanged inputs is reused, including one the user confirms.
2. **Dispatch.** Otherwise send two fresh reviewers in parallel, one per axis, never the agent that wrote the code (Claude Code: `work-item-reviewer`). Brief each with the base and head SHAs, repository, cases and acceptance, cited spec and convention sources, axis and an output path.
   - **Standards:** repository instructions, cited conventions and the available code-review skill.
   - **Specification:** every case's acceptance mapped to the changed behavior, naming any case the diff misses.
3. **Collect.** Each reviewer returns PASS, ISSUES with every finding's file, line, failure and severity, or BLOCKED. Drop a report for a different head and rerun that reviewer once; a second miss is a gap.
4. **Disposition.** Fix or dismiss every finding yourself, with a reason. Fix accepted findings within the approved scope, rerun only the affected checks, and review the changed delta.
5. **Record.** Run `review --run RUN --repo REPO --file REVIEWS` with the exact head (`templates/reviews.example.json`). Only `pass` certifies, and a later head needs fresh checks and review.

A receipt attests the named reviewer; it is not independent proof. An already approved action never opens a new review panel.
