# Implement an approved unit

**Input:** `start-unit` or `continue-writer`, current approved unit/plan, owner, source head and allowed paths.

**Read:** [execution policy](../delivery-rules.md#approved-execution-and-handoff), [coding discipline](../work-item-design.md#diagnosis-and-coding-discipline), and the cited repository convention/source sections in the brief.

**Skills:** invoke `pstack:principle-guard-the-context-window` before each approved unit and `pstack:deslop` before finish/handoff. Apply `pstack:tdd` only under the user's conditional request and a practical matching cheap behavioral seam; otherwise retain the justified skip and useful replacement check. For a newly exposed bug, apply `pstack:principle-fix-root-causes` and return to diagnosis. Route lists name direct entry skills; the card supplies conditional skills and the invoked skill owns its nested workflow.

**Action:** recheck design/readiness at new writer admission. Retain an active writer and its dirty/partial work until safely finished or explicitly parked. Bind the approved primary checkout or justified linked worktree through supported policy. Use one repo writer, scoped cases/paths, existing architecture, current references and exact checks. Capture actual before/after evidence and update the same PR draft. Native workers receive bounded fresh briefs and return unit reports to the coordinator.

**Output:** scoped implementation, actual check/evidence results, deslop disposition and `finish` report pinned to the clean intended head; commits only when authorized.

**Stop/return:** stop at completed unit, scope/design drift, a concrete blocker or safe ownership boundary. Keep blocked partial ownership visible; do not discard or transfer it silently. Material changes use alignment/replan before more edits. Resume after recording the outcome.
