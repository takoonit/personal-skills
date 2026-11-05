# Verify

**Procedure:** the `work-item-verify` skill.

**Input:** resume verification action, clean current head, approved check IDs and argv, cases and capture plan.

**Output:** head-pinned check and capture receipts, the Red-lock result, proof rows, exact gaps and QA/SIT handoff items.

**Stop:** every scoped check is recorded, or a precise failure or access gap names its units and unblock condition.

**Runtime enforces:** approved argv only, head pinning, stale-head invalidation and the dead-verifier recovery receipt.
