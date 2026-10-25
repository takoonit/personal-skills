# Execute an already approved action

**Procedure:** the `work-item-approved-action` skill.

**Input:** the approved-action route, the user's authorized action, the intended repository, PR, branches and head, and existing receipts.

**Output:** the requested remote state with a direct read-back receipt, or the new blocker's evidence, owner and minimum unblock condition.

**Stop:** after the action and its read-back; no new authoring, review panel or repeated consent.

**Runtime enforces:** one fresh preflight, `expected_head`, unknown data as a blocker, PR identity reuse and merge read-back.
