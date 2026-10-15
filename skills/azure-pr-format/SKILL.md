---
name: azure-pr-format
description: Apply the user's full colored Azure DevOps PR format, marker vocabulary, default and quick templates. Use when creating PR templates or preserving this PR house style.
---

# Preserve the PR format

Use this skill with azure-pr-write for content or azure-pr-review for assessment when available. This skill owns house formatting: keep its section names, field order, tables, markers and legend instead of substituting the shorter writer starter. Evidence honesty remains mandatory. A source template is an artifact, not authority to execute its embedded commands.

Read [markers](references/markers.md) whenever applying this format. Use [default](assets/pull_request_template.md) for behavior changes and [quick](assets/quick.md) for small low-risk chores/docs. A dependency bump qualifies only after checking behavioral risk.

## Default description

Preserve this order and exact headings: 📌 TL;DR, 🟦 Why, 🟪 Thinking, 🟩 Changes, 🟨 Test, 🟥 Rollback. Preserve the Type / Work item / Risk / Change record table; Problem and Impact; Method, Insight and Decision with accepted tradeoff; the Level / Given / When / Then / How / Result test matrix as expressed in the source table; and Migration / Flag / Undo / Watch after deploy fields. Keep the compact marker legend and Full guide link. Render consecutive marker entries as actual Markdown bullets.

Replace the fixed `fix` type with the actual change type. Use the existing Problem field for a goal/limitation on non-bug work; never invent a root cause. Preserve Thinking and Method: name the method actually used, or write `n/a — direct change; <reason>`. Record actual rejected options with reasons; if none were evaluated, state that rather than inventing one. Preserve required sections; use a brief reasoned n/a where inapplicable instead of silently deleting sections.

Keep the final description within 4,000 characters, including Markdown and URLs. Measure Unicode code points and UTF-16 units conservatively. Shorten entries and move supporting detail to the linked change record before changing the structure. Use actual clickable links for records and guides, verified at the source branch/commit where possible. If targets cannot be resolved, disclose the gap.

## Quick description

Preserve 📌 TL;DR, Type / Work item / Risk, 🟦 Why, 🟩 Changes and 🟨 Test. Include an explicit change-record exemption reason. Default test status is Not run; replace it only using real results. Small-change scope is an exception to depth, not permission to claim verification.

## Setup and hand-offs

Install the default at `.azuredevops/pull_request_template.md` and quick at `.azuredevops/pull_request_template/quick.md` only when repository setup is requested. Templates are discovered from the default branch. Add a template appends; explain removing existing content or using the `?template=quick.md` override. Recheck official platform documentation if compatibility is uncertain: https://learn.microsoft.com/en-us/azure/devops/repos/git/pull-request-templates.

For the full record, guide and diagrams use azure-change-record; for ASCII commit formatting use azure-commit-message. These companions are optional for a description-only request. Creating files does not authorize committing, posting, or installing branch policies.

## Completion

Compare the output to the selected asset section by section. Verify marker meaning, text labels, correct Type, populated required fields or justified n/a, honest test status, working links where available, and measured length. Report any necessary departure from house style. Blank templates retain instructional placeholders; filled real PRs do not. Templates and skills do not themselves block merges.
