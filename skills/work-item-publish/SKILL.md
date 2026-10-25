---
name: work-item-publish
description: "Work Item phase skill for staging a PR. Drafts the exact Azure DevOps PR payload with azure-pr-write, stages it and obtains approval of its hash. The approved create or update then runs in work-item-approved-action."
---

# Work Item publish

Run inside the [chain](../work-item-delivery/SKILL.md). The runtime card `docs/phases/publish.md` is the contract.

1. **Ready.** Every included case and the repository's final checks and reviews must be ready. Otherwise report the grouped hold, or propose a policy exception for the owner to decide.
2. **Write.** Reconcile the PR draft with the actual artifacts, then invoke `azure-pr-write` for What Happened, Insight and Proof of Works: repeatable steps, expected and observed results, accessible evidence links and a compact per-case coverage map. Keep the description within 4,000 Unicode code points and 4,000 UTF-16 units. A local file path is not an attachment.
3. **Stage.** Run `stage-publication --run RUN --repo REPO --file REQUEST`. It freezes the repository, source and target, head, title, full description, draft state, Work Item IDs and attachment bytes.
4. **Approve.** Show the exact payload and hash in chat, then ask (Claude Code: `AskUserQuestion`). Record the user's words with `approve-publication`. Approval of earlier copy never covers revised copy.
5. **Hand off.** The approved create or update runs in `work-item-approved-action`.

Ticket fields, comments, links and attachments each need their own exact-content approval. Publishing is not merging or deploying.
