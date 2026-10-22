# Start a Work Item

Use `$work-item-delivery` as the entry point. It coordinates prerequisite checks, planning, design, approved implementation, testing, and PR evidence. You do not need to invoke every supporting skill yourself.

## 1. Set up once

If the workflow is installed and available in your agent session, continue to step 2. On another machine, follow the [setup guide](setup.md) and [prerequisites](prerequisites.md).

The setup wizard guides you through these stages:

1. Choose the agent host and installation location.
2. Enable prerequisite plugins and confirm native trust prompts.
3. Connect Azure DevOps, specification sources, and browser access through the host.
4. Choose available models, reasoning effort, and automatic routing.
5. Install the workflow, run offline checks, and reload the agent.

Keep credentials in the host's authentication store. Preserve existing installations and local work. Cached skills and passing offline checks do not prove that live connections or routing work.

## 2. Start with the Work Item

Open the relevant repository in your agent host and send a Work Item ID or URL:

```text
$work-item-delivery Investigate <Work Item ID or URL>.
Show the developer plan, design review, realistic time estimate,
and human-reproducible verification plan before implementation.
Use swarm where independent work improves quality or speed.
```

The plan and approval steps are automatic. A shorter request containing the skill and Work Item URL is enough.

Provide specification links, the target repository, test environment, role, data, and deadline when available. State who owns QA or SIT. Keep private source details in your session and local run evidence.

The agent reads the live Work Item, acceptance criteria, linked specifications, repository instructions, current refs, and affected flows. For a bug, it investigates the root cause before proposing a fix. Missing access or conflicting requirements become explicit gaps or blockers.

## 3. Review the final plan and estimate

The agent drafts the specification and developer plan. It then runs `pstack:architect`, which includes one `pstack:arena` comparison, followed by `pstack:interrogate`. It resolves accepted findings and shows the final plan in chat.

Check that the plan includes:

- All reported cases, acceptance criteria, source links, and exclusions.
- The supported root cause or remaining uncertainty, proposed solution, and reasons.
- Affected repositories, paths, behavior, target baseline, and proposed branch.
- Dependencies, blockers, owners, ready order, and publication holds.
- Relevant unit tests, regression checks, downstream impact, and before-and-after evidence.
- Human-repeatable verification steps, required access and data, and QA or SIT ownership.
- Realistic time ranges for investigation, design, implementation, verification, review, and correction. Separate active agent work, human effort, and external waiting. Include assumptions and confidence.

Approve the final plan explicitly before product branches or edits to product code, tests, or configuration. A request to investigate or deliver does not approve an unseen plan. A material change to scope, baseline, or solution requires a revised plan and renewed approval.

## 4. Execute the approved scope

After approval, the agent rechecks readiness and follows repository conventions. It investigates root causes for bugs, limits working context to the approved unit, and uses TDD when a suitable project test pattern exists. It records a useful alternative when TDD is impractical.

The agent reviews affected callers and downstream behavior, runs relevant unit and regression checks, applies `pstack:deslop`, and reruns checks after substantive cleanup. Swarm workers help with independent investigation, verification, or evidence review when useful. Writers do not compete for the same repository state.

For unattended work, state the approved scope and stopping conditions before leaving. The agent keeps a decision trail and continues independent work where possible. Missing approval, access, or required review remains a hold. This workflow does not start a scheduler.

## 5. Require evidence a person can repeat

Use `$proof-of-work` to gather or review evidence. Follow the [human-verification guide](../vendor/work-item-runtime/docs/human-verification.md).

For each scenario, require:

- The environment and build, tester role, permissions, exact entry point, data, and starting state.
- Ordered actions with an observable expected result for each action.
- The actual baseline and fixed results, including the downstream outcome.
- Reviewer-accessible screenshots, requests, responses, logs, and supporting test results.
- The actual executor, cleanup, limitations, and any check not run with its reason and owner.

An agent may execute human-reproducible steps. Record who actually ran them. A planned procedure is not a completed test. A login failure is an access gap, not a reproduced bug. Local fixtures and passing unit tests do not establish SIT or deployment results.

## 6. Review and publish the PR

Require exactly these PR sections:

- `What Happened`
- `Insight`
- `Proof of Works`

Check that the description explains the changed behavior and reasons. In Proof of Works, include the repeatable steps, expected and observed results, and evidence links. Confirm that reviewers can access those links. Local file paths are not uploaded attachments.

Keep the complete description within the team's 4,000 limit in both Unicode code points and UTF-16 units. Passing collector checks establish recorded test execution, not acceptance or PR readiness.

Approve the exact PR text, attachments, and associations before publication. The agent publishes only the approved content and reads it back. Ticket updates require separate approval of exact fields, links, attachments, and comments. Merging and deployment are separate actions.

When continuing work, ask the agent to resume the existing run. Reuse its plan, evidence, and approval when unchanged. Reconcile interrupted ownership before replacing workers, and preserve dirty, staged, untracked, and ignored local work.
