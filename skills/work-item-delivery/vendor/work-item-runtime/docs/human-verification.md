# Plan evidence a human can repeat

Use the scoping and journey-mapping method from `mattpocock-skills:wizard` when planning evidence and writing Proof of Works. The goal is a procedure a reviewer can follow and results they can inspect. A user-facing step can be executed by an agent; record who actually performed it. Do not describe agent-run checks as human testing.

Use wizard's planning method here. Generate an interactive Bash wizard only for a concrete procedure containing actions the agent cannot perform and when such a script is useful. Routine application navigation, test execution and evidence collection stay with the agent when access and authorization allow them.

## Scope before collecting

Read the Work Item acceptance, versioned business rules, actual application/API flow and existing checks. For every case, establish:

- The tester's role, permissions, starting URL or request, relevant data and initial state.
- Exact visible actions and the expected observable result after each action.
- The baseline and fixed build/source identities, environment and fixture or real-data scope.
- What artifact demonstrates each result, who can collect it, and where the private artifact and reviewer-facing evidence will live.
- Any state-changing action, cleanup, missing access/data or unresolved business decision.

Reuse business-flow preconditions, `capture_plan.steps` and assertions, `unit_test_plan`, existing capture receipts and proof observations. Keep any additional prose in the existing run's investigation/plan notes. Do not create another execution ledger or change approved acceptance to fit an easier test.

Show the ordered procedure and its expected outputs with the developer plan, using the existing plan-approval step. A concrete procedure is ready when another person could follow it without guessing the route, control, data, action or expected value. Investigate unknown details; if unavailable, name the gap and owner. Never invent a UI path or claim placeholder steps are ready to execute.

## Map the journey and gather proof

| Stage | Instructions to author | Evidence to retain |
| --- | --- | --- |
| 1. Set up | Name the environment/build, role, exact entry point, dataset and starting state. Say where each required input comes from. | Source/build and data identity, preconditions and access limits. Keep credentials out of the evidence pack. |
| 2. Observe the baseline | Follow the case's exact actions on the baseline. State the expected result before observing the actual result. | Baseline SHA/build, actual disagreement and linked artifact. A setup/login failure is an access gap, not reproduction. |
| 3. Repeat on the fixed build | Use the same scenario and equivalent data/state on the tested source head. Record necessary differences explicitly. | Expected versus observed result and current-head artifact; capture the tested control or output, not only the page shell. |
| 4. Follow the result | Continue the user task: apply the choice, submit/search/read back, or inspect the API response/persisted outcome as the case requires. Include relevant boundary/error behavior and cleanup. | Evidence of the downstream result and affected shared behavior; precise coverage and remaining limits. |
| 5. Write and check the proof | Turn the actual journey into concise reviewer instructions and pair before/after outcomes. Link supporting unit/regression results separately within Proof of Works. | A readable PR draft, accessible evidence links and explicit missing checks with reasons. |

Each action names a visible control and value or a concrete request; each expected result names an observable value/state. Avoid instructions such as “verify the fix” or “confirm it works.” A backend-only case can use a reproducible API/request or existing test procedure; it does not need an invented UI journey.

Keep planned instructions distinct from execution records. A written procedure is not a completed test. Collect actual screenshots/DOM/network traces through the existing capture workflow where UI is affected. Attach before/after expected and observed results to the case using the existing receipts/observations, retaining artifact hashes and test identity. Preserve a missing phase as a gap or an evidenced non-applicability decision; never infer it from passing tests.

## Write Proof of Works for the reviewer

The full PR retains exactly What Happened, Insight and Proof of Works. In Proof of Works, lead with scope, then show how a person can repeat each case and compare the results. Use this authoring shape, replacing every bracketed instruction with investigated facts; absent runs use `Not run — reason`:

```markdown
## Proof of Works

- **Scope:** [environment; baseline and tested SHA/build; fixture/real data; limitations].
- **How to verify — [case and scenario]:** [role, preconditions and exact URL/request].
  1. [Concrete user action with data/value]. Expected: [visible result].
  2. [Continue the task]. Expected: [downstream result].

| Phase | Observed result | Evidence |
| --- | --- | --- |
| Before | [actual baseline behavior and its disagreement with expectation] | [before capture/log](reviewer-accessible-url) |
| After | [actual corrected behavior] | [after capture/log](reviewer-accessible-url) |

- **Executed by:** [agent/human and actual run attribution].
- **Automated checks:** [scenario/command, observed counts/results, log/review link].
- **Not run:** [applicable missing check, reason and owner/next step; omit if none].
```

For UI evidence, retain an inline two-column Before/After screenshot comparison where available, with compact scenario/environment captions and honest coverage. For APIs, retain relevant request/response evidence with secrets and unrelated personal data removed. Review known warnings, blast-radius findings and remaining limits; put material risk and reasoning into What Happened/Insight rather than burying them in logs.

Use the collector's private `evidence-index.json` and `proof-of-works.md` as inputs to this writing step. The current renderer does not generate these walkthroughs or enforce their completeness: `CHECKS_PASSED` describes recorded test execution. The author must inspect and write the human-verification evidence; source hashes do not certify its meaning. Preserve the original collector bundle so `--check` can still compare it; write the assembled PR to a separate draft, never edit generated output in place.

Before publication, check every claimed result against its artifact, verify the intended reviewers can access linked evidence, and measure the complete three-section draft in code points and UTF-16 units against the team's 4,000 limit. Local files are not uploaded attachments. Show the exact proposed text/attachments for existing publication approval; record actual read-back after an authorized write. These planning instructions do not publish, grant access or certify SIT/deployment.
