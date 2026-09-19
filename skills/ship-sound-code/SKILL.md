---
name: ship-sound-code
description: Implement an accepted repository change through relevant verification. Use for defined features, fixes, or refactors when no narrower workflow owns the work; skip unresolved product decisions.
---

# Ship Sound Code

Deliver the smallest complete change that satisfies the user's accepted outcome. Finish implementation, relevant verification, and corrections caused by the change within the authorized scope.

## Establish the contract

Use the current request or accepted brief to identify observable success, constraints, and affected surfaces. Read repository instructions, relevant configuration, nearby implementation, and tests. Trace only the boundaries needed for this change.

Choose routine, reversible implementation details yourself. Ask when a missing choice materially changes the outcome or requires new authority; continue independent work meanwhile. Use `shape-system-work` only for an unresolved consequential product or system decision. A formal brief or task list is not required for a clear small change.

## Implement proportionately

- Follow the repository's conventions, package manager, and supported commands.
- Preserve unrelated edits. Limit changes to the requested behavior and necessary supporting work.
- Prefer direct code. Add abstractions or dependencies for a current consumer, repeated rule, external boundary, or measured constraint.
- Validate untrusted inputs and enforce permissions from trusted identity. Preserve relevant invariants, compatibility, and recovery behavior.
- For UI work, cover the primary journey and relevant states, accessibility, and viewport sizes. For API or data work, cover the affected contracts and failure paths.

An explicitly requested refactor is authorized within its stated boundaries. Consult the user before a newly discovered rewrite or migration materially expands that scope, changes public behavior, or creates an unaccepted trade-off. Present concrete evidence and the smallest viable alternative.

## Verify the outcome

Use meaningful checks for the changed behavior and risk. Test wiring when wiring is the concern. Avoid tests that merely repeat implementation details or enforce cosmetic preferences.

Run applicable repository checks and honor CI requirements. For UI behavior, inspect the running result when available. Fix failures introduced by the change and rerun affected checks. Broaden testing when failures or unresolved risks justify it; report unrelated failures and unavailable checks accurately.

Do not stop at the first draft while authorized implementation or verification remains. Stop when the outcome is supported, the user requests a pause, or a real blocker requires their input.

## Finish

Report the resulting behavior, decisive verification, and material limitations. Include a next action only when something remains unresolved. Review the diff before a requested commit; stage explicit paths and preserve unrelated staged work.

Use `dexter`, `doakes`, or `lundy` only when removable complexity, conflicting intent, or consequential missing proof warrants that role. Completion alone does not require their invocation. Follow the user's authorization for publishing, pushing, merging, and deployment.
