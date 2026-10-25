# Implement an approved unit

**Procedure:** the `work-item-implement` skill.

**Input:** `start-unit` or `continue-writer`, the approved unit, owner, source head, allowed paths and Red tests.

**Output:** the scoped implementation, Red SHA with failing-before and passing-after output, deslop result and a `finish` receipt pinned to a clean head.

**Stop:** at a completed unit, scope or design drift, a concrete blocker or a safe ownership boundary.

**Runtime enforces:** plan approval, readiness, a clean bound workspace, one writer per repository, and refusal to release dirty or partial work.
