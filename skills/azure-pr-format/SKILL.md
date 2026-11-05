---
name: azure-pr-format
description: Apply the team Azure DevOps PR format (What Happened, Insight, Proof of Works), behavior-flow explanations, evidence layout and anti-pattern checks across backend and frontend.
---

# Apply the team PR format

Read [the writing convention and anti-patterns](references/team-writing.md) whenever drafting, revising or assessing a PR. It owns the default presentation for backend and frontend work. Use it with azure-pr-write for content and azure-pr-review for assessment.

Use [the default template](assets/pull_request_template.md), or [the compact template](assets/quick.md) for small changes. Both retain exactly `What Happened`, `Insight`, `Proof of Works`, in that order. Explain user action → function/request → service response/transformation → cause → fix. Include technical names only to make that causal flow understandable; keep implementation paths and filenames in the diff or evidence. Avoid the anti-patterns in the convention.

Preserve the user's approved text, requirement citations, evidence scope, inline images and results when revising existing PRs. Publishing a named approved draft means those exact bytes, followed by read-back verification. Keep both Unicode code points and UTF-16 units within 4,000. Do not add legacy headings, a full legend, mandatory diagrams or a mandatory change record to the team description.

## Explicit older-format requests

Only when the user or repository explicitly requires the older colored house style, use [the legacy full template](assets/legacy-colored.md) or [legacy quick template](assets/legacy-quick.md), and [the marker reference](references/markers.md). Preserve that selected structure, fields and markers, with honest n/a entries where required. The legacy full order is TL;DR, Why, Thinking, Changes, Test, Rollback. An existing legacy description alone is not a request to keep it when the user has approved a replacement.

For an explicitly requested detailed change record, use azure-change-record. Such a supporting record has its own structure; it does not replace the team PR headings. All formats require evidence-backed results, honest uncertainty and actual clickable evidence links.

## Setup and completion

Install repository templates only when setup is requested; creating skills does not authorize changing repo policy or templates. Consult azure-pr-write's platform reference when Azure compatibility matters. Templates discovered from a default branch and platform rendering need verification when relevant.

Compare the final description with the selected template and convention. Verify section order, causal explanation, anti-patterns, source/evidence limits, links and measured length. Follow the approved publication scope and read back changed fields. These skills do not authorize merges, ticket changes or deployment.
