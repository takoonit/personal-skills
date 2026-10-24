# Execute an already approved action

**Input:** resume approved-action route, actual user's authorized action, intended repo/PR/branches/head and applicable review/publication receipts.

**Read:** [execute after approval](../delivery-rules.md#execute-after-approval), [approval to action](../playbook.md#approval-to-action), and [harness receipts](../harnesses.md).

**Skills:** use existing native forge/authentication tools. This route requires no new authoring, architecture or reviewer panel solely for commit/push/publication/merge/read-back.

**Action:** record the actual instruction with `approve-action` if needed; existing publication approval is reused. Perform one bounded live check of the intended identity/head, blocking threads, required policies/checks and mergeability; retain `check-action`. A clear preflight proceeds in the same turn through the authorized native request. Unknown/failed reads are not empty checks. After an uncertain write, read actual state before retrying. Record direct remote read-back with the appropriate existing `published`/`action-completed` contract.

**Output:** actual requested remote state and source-bound receipt, or exact new-blocker evidence/owner/minimum unblock condition.

**Stop/return:** finish after the authorized action and read-back. Reuse completed reviews and checks for unchanged inputs; material invalidation needs only affected delta work under existing rules. Publish ready for review unless Draft requested; approval/merge means the authorized vote and completed merge. Plan approval alone grants neither. No helper tooling, unrelated refactor, extra verification panel or repeated consent.
