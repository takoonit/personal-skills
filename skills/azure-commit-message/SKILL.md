---
name: azure-commit-message
description: Draft or revise concise Azure DevOps commit messages grounded in the diff, with useful rationale and accurate work-item references.
---

# Azure commit messages

Write for someone reading git history: what changed, and why when the reason is not obvious. Use the shortest message that explains the change accurately.

Inspect the staged diff or explicitly selected commit range before drafting. For a proposed fix, describe it as proposed outside the message; do not imply implementation or verification has happened. For a squash message, use the complete PR diff.

## Shape

Start with `<type>(<scope>): <imperative summary>`, at most 72 characters. Omit an unhelpful scope. Use the actual change type: fix, feat, refactor, perf, test, docs, chore, build, or ci.

A subject alone is enough for an obvious small change. Otherwise add a blank line and a short paragraph explaining the reason or meaningful behavior change. Add more detail only when needed to explain a non-obvious tradeoff, compatibility impact, or material verification limit.

**Why / How / Log / Test / Refs are content considerations, not mandatory sections or literal headers.** Use ordinary prose by default. Include only what helps explain this commit:

- Why: the concrete problem or reason, when the subject does not explain it.
- How: the approach only when it is not evident from the change.
- Log: relevant decisions or outcomes, not a chronology of the session.
- Test: accurate verification only when it adds useful confidence or identifies a material limitation.
- Refs: a real work-item reference when requested or relevant.

Do not fill every category. Do not add empty labels, `n/a`, a named thinking method, or routine `not run` placeholders. Do not repeat the PR description or test output just to satisfy a format. A consequential untested risk should still be stated briefly. Never invent test results.

Journal markers are optional, only when the user requests journal-style output: `o` event, `-` note, `x` confirmed, `~` rejected, `>` moved, `<` waiting, `.` open, `!` insight, `?` unresolved, `!!` risk, `*` priority. They are not a checklist.

## References and scope

Use a trailer such as `Refs: #123` for an intended Azure Boards reference. Avoid a bare line beginning with `#123`: Git's default comment cleanup can remove it. The trailer label is useful syntax, not a requirement to add a Refs section to every message.

Use resolution wording such as `Fixes #123` only when resolution is intended and the repository's workflow is verified. Do not promise work-item resolution from a commit message alone.

Drafting a message does not authorize committing, posting, or changing Git configuration. Configure `commit.template` only when requested. The optional [template](assets/.gitmessage) contains guidance comments, not required output fields.

## Examples

Small change:

```text
fix(import): skip inactive plans during claim preview
```

When the reason matters:

```text
fix(claim): preserve enrollment-error precedence

Check enrollment before parent status so unenrolled employees keep the
existing rejection message.
```

Before delivery, check that the message matches the diff, adds no unsupported claims, and contains no filler. Preserve user-approved wording outside the requested edits.
