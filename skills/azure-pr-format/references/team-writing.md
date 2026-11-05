# Team PR writing convention

Use exactly these headings, in order: `## What Happened`, `## Insight`, `## Proof of Works`. This is the default for backend and frontend PRs, including small changes. An explicitly requested repository format can override it. The older colored format is opt-in; do not insert its extra sections into this one.

## What Happened

Lead with the resulting behavior and purpose. Identify the affected screen with a useful UI breadcrumb and route, or the module/API for a backend change. Link the actual Task and relevant parent Bug expectation. If the Task explains the problem, summarize it briefly instead of copying the ticket. Include risk with a readable word and reason, and where the issue was found when known. Separate the reported environment from the baseline actually reproduced; preserve differences.

## Insight

Explain the behavior flow: **user action → function/request → service response or transformation → why the wrong result occurred → changed behavior and why it fixes it**. Adapt this to a feature's previous limitation; a business goal does not require an invented bug.

Name functions, classes, APIs, fields or helpers only where they explain a step. Use the owning service and HTTP method/endpoint when useful. Explain what a named function does and how its output reaches the user. Do not force a request into a display-only fix. Cover frontend and backend where the flow crosses both.

When the change settles an open requirement question by assumption, list each assumption under “Limits” with the person who must confirm it, plus known follow-ups on sibling screens and who decides them. Do not present an agent's assumption as decided scope.

Use short bullets with meaningful labels, such as “When HR opens…”, “Why extra years appeared”, “Changed flow” and “Limits”. Explain actual constraints, data ambiguity, unknown mappings, pagination, cancellation or error behavior only when material. Include version-pinned specification references, conflicts, release dependencies and rollback consequences where they affect review. Keep these inside Insight rather than adding sections. Mention approved incidental cleanup briefly and accurately.

Implementation file paths, filenames and changed-file inventories belong in the diff or supporting evidence. Insight tells the causal story. Concise means enough connected explanation to understand the result, not a chain of unexplained identifiers.

## Proof of Works

State the evidence scope first: environment, baseline, fixture/real data and limitations. Keep reported SIT behavior, tested local behavior and deployment status distinct.

Lead with real browser captures of the fixed build, one per user step, each with its expected and observed result. Show After only unless the user asks for Before. Never offer the reported bug screenshot as proof, and keep test counts to one supporting line: counts beside a bug image read as “nothing was tested”.

Use the template's case blocks for role/setup, product actions, expected result and observed results. UI blocks render original full screenshots, each with its full-size link. A crop is an optional detail after the originals. Describe screenshot coverage honestly: a capture showing six choices does not prove all nine; link the assertion or additional capture. Automated counts and downloadable evidence support the case blocks. Mention existing warnings or unresolved checks accurately. Attribute previous runs; drafting PR prose does not rerun them. Use `⏳ Not run — reason` for a planned or absent check. API/CLI cases use their action and output evidence; prose-only work needs relevant document checks.

## Anti-patterns and corrections

| Anti-pattern | Use instead |
|---|---|
| “Changed A.tsx, B.service.ts and C.repository.ts.” | Describe the user's action, the request/data transformation and the result; leave the file inventory in the diff. |
| “Fix `fetchYears()` / update `toRow()`.” | Explain where the old choices came from, what the function now reads and why the visible choices change. |
| “The frontend was wrong.” | Trace the concrete value: for example, the table loaded employee history while the dropdown independently loaded the full catalogue. |
| A backend-only account of a UI failure, or an invented backend call for a display-only change. | Trace the actual boundary where the value changes; keep UI-only fixes local to that flow. |
| Repeating the Task, adding generic TL;DR/Why/Changes headings, or pasting the full marker legend. | A short linked problem under What Happened, then Insight and Proof of Works. |
| A method, root cause, rejected option or tradeoff invented to fill a template. | Record only supported findings and decisions; leave real uncertainty visible. |
| A test plan marked ✅, old logs presented as a new run, or fixture results called SIT verification. | State observed vs expected, attribute recorded runs and identify the actual environment. |
| “All nine choices verified” beside a screenshot of six choices. | State the capture's coverage and link the evidence for the remaining choices. |
| Quietly dropping a spec conflict, warning, data ambiguity or release dependency to fit the limit. | Keep the material limit concise and move supporting detail to linked evidence. |
| Rewriting approved copy during publication or changing unrelated PR fields. | Publish the approved bytes; if the draft or remote state changed, resolve that change before publishing. |

## Existing PR revisions and publication

When the user approves a specific draft, preserve its exact text and linked evidence. Read the live descriptions and relevant metadata before updating. Check the approved draft hashes and description preconditions. Change only the authorized fields; preserve titles, branches, draft/status, reviewers, labels, work-item associations and attachments for a description-only edit. Keep existing screenshots, links, evidence scope and test outcomes unless the user approves an evidence-supported revision. Re-read the saved descriptions and relevant metadata afterward; verify attachment manifests/hashes when the approved publication plan includes them.

The user's current explicit approval can authorize publishing that named draft; stale “not authorized” flags inside the draft are historical state. It does not authorize later textual revisions, ticket changes, merges or deployments. Ticket/work-item changes require their own exact-content approval under the project rules.

Count the complete description, including Markdown and URLs, in Unicode code points and UTF-16 units; keep both at most 4,000. Shorten repetition and link supporting evidence before cutting a material qualification. Never pad to the limit. Detailed records and diagrams are optional supporting artifacts when useful or required, not mandatory extra PR headings.
