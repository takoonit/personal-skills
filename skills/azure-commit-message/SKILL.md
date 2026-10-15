---
name: azure-commit-message
description: Format Azure DevOps commit messages with the user's Why, How, Log, Test, Refs sections and complete ASCII journal markers, including Azure Boards reference rules.
---

# Commit message format

Use [the commit template](assets/.gitmessage). Inspect the actual staged diff or explicitly selected commit range and supplied verification before drafting. Writing a message does not authorize creating a commit or changing Git configuration. Configure `commit.template` only when requested; prefer repository scope unless global setup is requested.

First line: `<type>(<scope>): <imperative summary>`, at most 72 characters. Types: feat, fix, refactor, perf, test, docs, chore, build, ci. Omit scope if unhelpful; use the actual change type.

Retain sections in this order:
- Why: 1–3 lines explaining goal/problem and impact; root cause when evidenced.
- How: technical approach, actual thinking method and key justification/tradeoff. Use reasoned n/a when no investigation method applies.
- Log: concise ASCII journal entries with the mappings below.
- Test: actual scenario/command and result, or `not run: reason`; attribute supplied results.
- Refs: real Azure Boards IDs, with Record path in the final paragraph if applicable.

ASCII mappings: `o` event; `-` note; `x` done/confirmed; `~` dropped/rejected with reason; `>` moved with destination; `<` waiting/scheduled with reason; `.` open; `!` insight; `?` unresolved question; `!!` risk; `*` priority prefix. Status words disambiguate tests from work items. Use only applicable entries, not one of each.

For small commits the supplied convention permits subject + Why + Test; remove unused labels. For substantive commits retain the full structure while targeting 5–15 lines when feasible. Never manufacture an alternative or result for completeness.

Write `Refs: #123` rather than a bare `#123` line: default Git cleanup can remove leading # comments (custom settings may differ). `Fixes #123` requires an intended resolution, actual work item, repository setting and supported default-branch workflow. The documented PR post-completion resolution excludes squash merges and requires Complete associated work items. Rewriting a squash message is not guaranteed to resolve work items. Verify current official guidance if giving platform advice: https://learn.microsoft.com/en-us/azure/devops/repos/git/resolution-mentions.

Before delivery verify subject length, section order, ASCII meanings, real IDs/path, agreement with the diff/change record, and evidence for test claims. Keep template instruction comments out of the finished message. For squash completion draft only from the complete PR diff, not the last incremental commit.
