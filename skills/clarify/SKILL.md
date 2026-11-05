---
name: clarify
description: "Clarify a vague requirement before building it: trace what a thin ticket, spec or request literally says and points at, derive its scope, label each conclusion by source, and write a clarified ticket with a Need Confirmation table. Use when a work item has one line or no acceptance criteria, a spec is draft or ambiguous, someone asks what a card means or what its scope is, asks to rewrite a thin ticket, or code was started before the requirement was clear."
---

# Clarify

A thin ticket is a **pointer**, not a requirement. Find what it points at, show where each conclusion came from, and hand the owner a short decision request. The output is a clarified ticket in a Markdown file under the repo's research or docs folder. Drafting it changes nothing in the tracker.

Run the steps in order. Each ends on its completion criterion.

## 1. Intake

Read the ticket the way its author made it:

- Quote the description and title **verbatim**, in their original language.
- Read the revision history: who wrote it, how long they took, whether anyone edited it later, and the comment count.
- Open every attachment and screenshot and say what each one shows. To view an Azure DevOps image attachment, use [`scripts/decode-ado-image.ps1`](scripts/decode-ado-image.ps1).
- Read the acceptance criteria field, and the parent's.

Use the authoring effort to decide how literally to read the words. A one-minute note with a hedge ("น่าจะ", "probably", "maybe") and a screenshot is the author pointing at the screenshot. Its listed items show what the author was unsure about. They are not binding scope.

Done when: the literal text, the authoring history, and the content of every attachment are written down.

## 2. Glossary

Map each term in the title and description to something that exists:

- a named service, and what it can do today (read its client package or API, not only the repo's wrapper)
- a spec column, value or class definition
- a code module or table

A term that maps to nothing is flagged **unmatched**: likely noise, to be confirmed with the owner.

Done when: every term is either mapped, with its source, or flagged unmatched.

## 3. Scope

Derive the boundary from the parent card and its siblings:

- Read the parent's description and the spec it links.
- For each sibling card, record what it owns and what it explicitly leaves out.
- This card's scope is the part of the parent's spec that no sibling owns. Things the siblings own are this card's exclusions.

Done when: the scope fits in one sentence ("the X column, for rows N–M, in service S"), and each exclusion names the card that owns it.

## 4. Provenance

The first thing you show the user is a provenance table. Every claim gets a strength label:

| Claim | Source | Strength |
|---|---|---|
| … | ticket, linked spec, sibling card, code, earlier research | stated / indirect / assumed |

- **Stated:** the ticket, spec or code says it.
- **Indirect:** follows by elimination or inference from a source.
- **Assumed:** our own choice, with no source.

List assumed items separately as assumptions to confirm. Keep these labels in every later summary and chat reply, not only in the file. Treat a claim from an earlier research doc as a lead: re-check it in the code or source that owns it, and note the commit or checkout you checked.

Done when: every claim in the output carries a source and a strength, and no carried-over claim is still unchecked.

## 5. When research is done

Research is done when the remaining unknowns can only be settled by the author's intent. Mark each unknown:

- **Safe assumption:** reversible, so work can go ahead under it, and it's stated in the ticket.
- **Blocks:** changes code, data or legal meaning. Ask the owner.

Then stop reading and move to the draft. One sharp question to the owner beats another round of reconstruction.

Done when: every unknown is marked safe or blocks.

## 6. Requirement, then the code

Write the requirement from steps 1–5 only, as if no code existed. When code already exists (a branch, a PR), compare it in a separate section afterwards: what matches, what goes further, and what is missing. Test results belong in that section as implementation evidence, never as progress on the requirement.

When explaining the ticket to the user, start with what it literally says and how far the reading goes beyond it. Only then say how or why anything is built.

Done when: the requirement section has no reference to the branch, and the comparison is its own section.

## 7. Draft

Write the clarified ticket:

- Use the user's template for the ticket type when one exists in [`references/`](references/), or one they paste. Fill what applies, and mark the rest "not applicable" with a one-line reason.
- Write in English unless the user asks for another language.
- Acceptance criteria hold only stated or confirmed behaviour. A criterion that depends on an open question ends with "Pending question N".
- Write plainly: short sentences, no inline bold labels, sentence-case headings.

Done when: every criterion is either sourced or tagged pending.

## 8. Need Confirmation

Put open points in a table:

| # | Question | Proposed | Affects | Decision |
|---|---|---|---|---|

- **Proposed:** a sensible default, so the owner can just agree. When code exists, propose what the requirement needs, not what was built.
- **Affects:** who breaks if the default is wrong. Name consumers outside the team, for example another service that calls this API.
- **Decision:** left empty, for the owner.

Rank the questions by whether the answer changes code, data or legal meaning. Put at most three at the top. Move questions that come from a generic template, and do not block this card, under "Later or another card".

Done when: the top questions each change code, data or legal meaning, and every row has a proposed default.

## 9. Self-review

Before showing the draft, check it against the steps:

- Every claim has a source and a strength (step 4).
- Every criterion is sourced or pending (step 7).
- No proposed default simply mirrors existing code (steps 6 and 8).
- Every carried-over claim was re-checked (step 4).

Fix what fails. Note the weak spots you could not fix, for step 10.

Done when: every check passes or its failure is shown to the user.

## 10. Approval

Show the user the whole draft: open the file in the editor or file pane, or paste it in the reply when no pane exists. List the weak spots from step 9 under it. Then ask one question: approve it as is, or change it.

Each round of changes is another approval round: apply them, show the updated draft, and ask again. The draft stays a draft until the user says it is approved, in words.

Done when: the user has approved the current draft in words.

## 11. Delivery

Leave the author's description intact. Offer to deliver the approved draft, or its Need Confirmation table, as a ticket comment, or as a questionnaire via `/to-questionnaire`. Show the exact text and destination, and post or edit in the tracker only after the user approves that.

Done when: the user has the file path and has chosen how, or whether, to send it.

## Legwork

For heavy reading, use the `research` skill. Brief it with the ticket's literal text and neutral questions. Give any existing reading or implementation as a hypothesis to test, never as the definition of the requirement.

## Hand-offs

- A clarified requirement that still needs product or architecture trade-offs goes to `$shape-system-work`.
- A request whose code change drifts from the project's intent goes to `$doakes`.
- Wording the questions for the owner can use `$clear-tactful-writing`.
