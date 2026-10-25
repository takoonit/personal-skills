---
name: work-item-publish
description: "Work Item phase skill for staging a PR. Drafts the exact Azure DevOps PR payload with azure-pr-write, stages it and obtains approval of its hash. The approved create or update then runs in work-item-approved-action."
---

# Work Item Publish

Run the `publish` phase through the [phase chain](../work-item-delivery/references/chain.md). Its card is `docs/phases/publish.md` under the runtime, and the card owns this phase's inputs, actions and stop conditions.
