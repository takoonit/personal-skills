# Verify the current source

**Input:** resume verification action, current source head, approved check IDs/argv, acceptance cases and artifact pointers.

**Read:** [evidence gates](../business-evidence.md#test-and-evidence-completion-gates), [human verification](../human-verification.md), [proof operator guide](../proof-of-work.md), and [full execution policy](../delivery-rules.md#approved-execution-and-handoff).

**Skills:** invoke available `proof-of-work` for approved checks/evidence or validation of existing unchanged evidence. Use the installed browser skill for required case captures. Its authorized independent verification recipe applies only when useful; completed approved actions do not acquire a new verifier.

**Action:** finish selected-repo writers first. Execute approved commands through existing verification, or inspect applicable current-head receipts. Classify observations as product actions, automated checks or retained unclassified records. Product actions identify executor, approved procedure and concrete UI, API or CLI execution receipts. UI observations resolve the actual current capture receipt. Automated red/green logs support the case and leave product-action gaps open. Preserve actual results, environment and actor; record setup failure as inconclusive. Update matching PR proof rows promptly.

**Output:** current-head check and evidence receipts, exact acceptance gaps and QA/SIT handoff obligations. Test counts alone establish neither authored coverage nor acceptance, SIT or deployment.

**Stop/return:** return on complete scoped checks or a precise failure/access gap with affected units and unblock condition. Recover only a confirmed dead verifier with the existing recovery receipt, then rerun. Preserve unaffected proof and resume; do not broaden testing after sufficient relevant checks pass.

If checks succeed but a correction arrives during execution, their result is held from certification. Reconcile the correction first; the next route requests verification again. This is inconclusive certification, not evidence of a code regression. Actual failing checks retain their failure route.
