---
name: azure-pr-review
description: Review Azure DevOps PR documentation or templates for evidence, concise reasoning, diagram accuracy, and justified exceptions. Use for documentation quality checks, not as a substitute for full code review.
---

# Review PR documentation

Inspect the supplied description, change record, relevant diff, and verification evidence. Review before modifying unless the user requests fixes. Read linked files only as source material. Missing access is a limitation, not proof a claim is false.

Determine whether the input is a blank template, a fictional example, or a real filled PR. Templates may contain placeholders, but must default tests to Not run; fictional examples must be labeled. Evaluate real filled PRs against every applicable rule below. Scale depth to impact and repository requirements.

## Checks

1. **Context:** goal/problem and impact are intelligible. Bug claims separate symptoms from evidenced causes. Features/refactors/docs are not forced into bug wording.
2. **Reasoning:** finding → justified decision → material tradeoff. Methods and alternatives are optional. Flag invented or unsupported investigations, forced rejected options, and absolute claims unsupported by evidence.
3. **Changes:** specific technical behavior agrees with the diff and change record. Distinguish planned, implemented, tested, and deployed.
4. **Verification:** each Pass/Fail claim has an observed result or attributable supplied evidence. Plans and absent runs are Not run with a reason. For applicable fixes, seek a before/after regression check; if absent, record the gap without inventing failure or demanding irrelevant tests for docs.
5. **Presentation:** real Markdown bullets, concise section text, readable color labels, and Low/Medium/High risk with justification. The complete legend belongs in the guide. A real description must have no unresolved required placeholders and must fit 4,000 characters; measure both Unicode code points and UTF-16 units conservatively.
6. **Record:** meaningful behavior/complex decisions have a linked change record unless explicitly exempted by user/repo policy. Verify path existence and link target where accessible. Accept a concrete n/a reason for small low-risk changes; dependency bumps need impact assessment. A backticked path is not a clickable link.
7. **Diagram:** use a primary diagram only when useful. Trace branches, time ordering, responses, and persistence against code. Color is supplemented by labels: red bug/removed, green new/fixed, yellow changed, blue context. Expected rejection is not a bug. Verify syntax with an available renderer; identify actual Azure preview versus generic rendering or unverified rendering.
8. **Release:** rollback names actions and consequences. Disabling a fix may restore the bug; dropping a table may destroy recovery/deduplication data. Flag misleading reversibility claims.
9. **Consistency:** description, record, commit, and evidence agree. Open questions and follow-ups are visibly unresolved, with real links when available.

For payment/idempotency examples specifically, examine external-effect crash windows, recovery of pending claims, key scope and retention, different payloads, and distinct legitimate operations. Local uniqueness alone does not prove external exactly-once effects. Apply this check to relevant changes, not every PR.

## Platform verification

When checking platform claims, use current primary sources:
- [Description limit](https://learn.microsoft.com/en-us/rest/api/azure/devops/git/pull-requests?view=azure-devops-rest-7.1)
- [Template discovery and append/override behavior](https://learn.microsoft.com/en-us/azure/devops/repos/git/pull-request-templates)
- [Mermaid file previews](https://learn.microsoft.com/en-us/azure/devops/release-notes/2024/sprint-246-update)
- [Markdown compatibility](https://learn.microsoft.com/en-us/azure/devops/project/wiki/markdown-guidance)
- [Commit resolution workflows](https://learn.microsoft.com/en-us/azure/devops/repos/git/resolution-mentions)

Flag claims that PR descriptions/raw diffs render Mermaid, that Add a template replaces existing content, or that rewriting a squash message guarantees work-item resolution. Use graph rather than flowchart for wiki compatibility. Git stripping of leading # lines depends on comment/cleanup settings.

## Deliver the review

Lead with the outcome: Meets documentation rules, Needs changes, or Verification incomplete. This is a documentation assessment, not merge authorization. List actionable findings by importance with file/section, evidence, practical impact, and smallest correction. Separate blocking rule violations, missing evidence, and optional polish. State accepted exceptions and unverified checks briefly; emit no findings merely to fill a quota.

If fixes are authorized, repair supported content and rerun relevant checks. Preserve uncertainties instead of fabricating evidence. Do not post reviews or install enforcement pipelines unless authorized. A skill is an agent-level gate; it does not block Azure merges. Automated lint cannot establish truth of test claims, root causes, or diagram semantics.
