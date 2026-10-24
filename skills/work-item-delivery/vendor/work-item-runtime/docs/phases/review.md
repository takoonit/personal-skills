# Review the exact implemented head

**Input:** resume review action, exact source head/diff, directly read acceptance/spec/convention sources, current verification and prior review receipts.

**Read:** [review/publish playbook](../playbook.md#5-review-and-publish), [full execution policy](../delivery-rules.md#approved-execution-and-handoff), and applicable cited repository rules.

**Skills:** inspect and invoke the available code/spec review skills fitting this scope, such as `mattpocock-skills:code-review` or the applicable `pstack` review. Use authorized independent native reviewers where required/supported; disclose limitations.

**Action:** first determine whether an accepted completed review already covers unchanged inputs. Reuse it. Otherwise brief reviewers with the exact base/head, cases, source pointers, paths and focused criteria; retain raw findings and lead disposition. Review actual behavior and standards/spec coverage. Correct accepted findings under approved scope and rerun only affected checks/review after substantive changes.

**Output:** exact-head review report, every finding's disposition, and the existing `review` receipt or concrete hold.

**Stop/return:** return when scoped findings are resolved/dispositioned and the applicable head is certified, or report the precise blocking finding. Already approved execution routes to approved-action without another review panel. Resume selects publication or further work.
