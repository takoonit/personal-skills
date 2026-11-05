---
name: work-item-promote
description: "Promote a merged Work Item fix to the next environment and close the loop. Use for \"promote to SIT\", \"cherry-pick to sit\", \"if CI passes, merge and promote\", \"inform QA when SIT is online\" or \"move the ticket\". Runs the repository's release order, waits on the deploy stage, then updates the Work Item and QA."
---

# Work Item promote

Promotion is the release order after the source PR is approved: source PR merged, environment branch updated, deploy confirmed, tracker and QA told. Run it inside the [chain](../work-item-delivery/SKILL.md) or on its own; it needs no delivery run, only the PR and Work Item ids.

## Release facts

Read the repository's release facts before acting: the runtime `config.json` `release` block when present, else project memory, else ask once and save the answer to project memory. A release fact is:

- **source branch** the PR targets first (for example `develop`) and **environment branch** promoted to (for example `sit`);
- **promotion branch name** cut from the environment branch (for example `<fix-branch>-on-sit`);
- **merge strategy** for the environment PR, and whether its source branch is deleted;
- **deploy pipeline and stage** whose success means the environment is online;
- **CI gate**: the forge's required checks, or, when the forge runs none, a local verify on the exact head being merged;
- **PR conventions**: optional reviewers, attribution policy.

Keep organisation names, identities and URLs in config or memory, never in this skill.

## Steps

1. **Source PR merged.** Confirm the source PR is Completed and its merge commit is on the fetched source branch. Until it is, the environment branch stays untouched: promoting first leaves the source and environment branches mismatched. Merging the source PR follows [`work-item-approved-action`](../work-item-approved-action/SKILL.md).
2. **Gate.** Apply the CI gate to the merge commit. With no required forge checks, the gate is the repository's local verify on that commit; the green post-merge pipeline is a deploy signal, not the gate. A missing run is not a pass.
3. **Promotion branch.** Cut the promotion branch from the fetched environment branch, cherry-pick the source PR's commits in order, and run the same local verify on the cherry-picked head, which no check has seen yet. A conflict stops here with the conflicting files.
4. **Environment PR.** Open it with the repository's PR conventions, merge it with the configured strategy once the user's instruction covers merging, and read the result back from the forge.
5. **Online.** Watch the deploy pipeline triggered by the environment merge until the configured stage succeeds, and confirm it deployed the merged commit. That stage is the online signal. Reaching the environment's site directly is out of scope.
6. **Close the loop.** Move the Work Item to the state the team uses for "ready to test" and post the QA note. The note is new agent-written text: show its exact content and get approval before posting, even inside a pre-authorised chain. State what changed, where to test and the deployed commit; leave out test steps unless asked.

Done when the environment PR is Completed, the deploy stage is green for the merged commit, and the Work Item state and QA note are read back from the tracker. Report each with its link.
