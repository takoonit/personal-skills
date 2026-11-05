---
name: azure-change-record
description: Create full Azure DevOps change records with the user's investigation tables, thinking methods, colored Mermaid diagrams, test plan, release details, and future notes.
---

# Detailed change records

Read [the template](assets/_TEMPLATE.md) and the relevant sections of [the guide](assets/PR_GUIDE.md). Use [the fictional example](assets/EXAMPLE-2026-10-15-412-payment-idempotency.md) for structure only; its test results are invented examples, not evidence or a production design guarantee. This structure applies to detailed records only. PR descriptions default to the three-section team convention in [azure-pr-format](../azure-pr-format/references/team-writing.md), including its anti-pattern checks; use this longer record only when requested or useful. Preserve evidence limits and the user's current instructions.

Create `docs/changes/YYYY-MM-DD-<workitem>-<slug>.md`; use actual metadata and omit an unavailable work-item ID rather than inventing one. When setup is requested, copy the template and guide to `docs/changes/_TEMPLATE.md` and `docs/PR_GUIDE.md`. Copy the fictional example only if examples are requested. These actions do not authorize commits or publishing.

## Preserve the full record

Retain metadata (Work item, Pull request, Author, Date, Type, Risk), the complete color legend, and these ordered sections:
1. 🟦 1. Why (Context Log): chronological facts/events, Problem statement, Impact.
2. 🟪 2. Thinking (How we decided): Method; 2a Investigation trail with Hypothesis / Experiment or Evidence / Result; Insight; 2b Options considered with Pros / Cons / Verdict; Decision, accepted tradeoff, Assumptions.
3. 🟩 3. What changed: status-marked changes, follow-ups, questions, Files that matter.
4. 🎨 4. Diagram: primary diagram or before/after pair, with exact palette below.
5. 🟨 5. How to test: 5a reproduction (fix only), 5b test matrix, 5c Run it yourself, 5d Evidence.
6. 🟥 6. Release & Rollback: migration, flag, config/variable group/Key Vault, rollback, monitoring and duration.
7. ⬜ 7. Note to future you: insight and linked follow-ups.
8. Author checklist.

Keep headings and tables; mark inapplicable sections `n/a — reason`. Do not fabricate hypotheses, rejected options, dates, commands or results to fill them. Describe a feature's goal/constraint in Problem statement rather than forcing bug language. Use actual Markdown bullets for separate marker lines. Record method and evidence as a concise investigation/decision summary, not an exhaustive private thought transcript.

## Select and explain the method

- Hypothesis → Experiment: plausible causes; hypothesis, discriminating experiment, observed result and conclusion.
- 5 Whys: evidenced causal chain ending at an actionable cause; stop at evidence boundaries, not an arbitrary fifth step.
- First Principles: verified constraints, assumptions, and design derived from them.
- Trade-off Matrix: actual alternatives, pros/cons, choice and accepted cost.
- Bisect: known good/bad revisions, tests and identified culprit; label untested boundaries.
- Spike: question, bounded experiment, findings, discarded work and decision.

Combine methods only when actually used. For straightforward work retain Method with a reasoned n/a. No rejected option is preferable to fictional investigation.

## Diagrams

Choose sequence for interactions/races, graph for branching, state for lifecycle, class for structure, ER for schema. One primary view is the default; before/after may be a pair. Additional views must answer a distinct reviewer question. Use `graph TD` or `graph LR` for wiki compatibility. Keep Mermaid in Markdown file previews, not PR descriptions. Verify actual target-surface syntax; wiki and repo fences may differ.

| Meaning | Fill | Stroke | Text | Sequence rect |
|---|---|---|---|---|
| Bug / removed | #ffebe9 | #cf222e | #82071e | rgb(255, 235, 233) |
| New / fixed | #dafbe1 | #1a7f37 | #116329 | rgb(218, 251, 225) |
| Changed | #fff8c5 | #9a6700 | #7d4e00 | rgb(255, 248, 197) |
| Unchanged context | #ddf4ff | #0969da | #0a3069 | rgb(221, 244, 255) |

Use supported classDef/class styling for graph/state/class only after checking the target renderer; these grammars are not interchangeable. For sequences use rect plus explicit Note labels BUG, NEW, CHANGED, CONTEXT. For ER use supported styling or labeled entities with a legend; preserve semantic labels if colors are unsupported and disclose the limitation. Expected rejection is not a bug.

Trace every path and temporal order against code, including persistence before replay and failure recovery. Validate syntax with an available renderer and identify whether actual Azure preview was tested. Generic rendering is not Azure validation; theme/readability claims need visual inspection.

## Test and release evidence

Keep Unit, Integration, E2E/Manual, Regression and Edge rows; use justified n/a when irrelevant. Default results to Not run with a reason; Pass/Fail needs actual observed or attributed evidence. For bugs distinguish expected before/after from observed reproduction. Commands must come from the repository, not assumed pnpm scripts. Run it yourself must state prerequisites and safe environment for side effects.

Document rollback consequences, data loss, bugs reintroduced by disabling flags, and monitoring. For external side effects/idempotency, examine crash-after-side-effect recovery, pending requests, key scope/retention, and legitimate distinct operations. Local uniqueness does not prove exactly-once effects.

## Completion

Compare every heading, table, marker and palette entry to the source template. Check content against the diff, links and evidence; report incomplete verification. Keep the author checklist honest: unchecked items and explicit n/a are valid; manufactured rejection or pass evidence is not. Ensure PR summary and record agree. Review source-specific caveats attached to the example before reusing its design.
