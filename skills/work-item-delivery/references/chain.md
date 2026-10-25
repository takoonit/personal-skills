# Phase chain

Each `work-item-<phase>` skill runs one runtime phase and then hands off. The runtime's `resume` packet chooses the phase, and the skill for it is always `work-item-<routing.phase>`, so the chain needs no table. `work-item-delivery` stays the entry point and the full policy; a phase skill can also be started directly.

| Phase | Skill | Card |
| --- | --- | --- |
| Intake, investigation, challenge, arbitration | `work-item-investigate` | `docs/phases/investigate.md` |
| Design and plan authorship | `work-item-design` | `docs/phases/design.md` |
| Corrections and missing decisions | `work-item-align` | `docs/phases/align.md` |
| Approved unit implementation | `work-item-implement` | `docs/phases/implement.md` |
| Checks and evidence | `work-item-verify` | `docs/phases/verify.md` |
| Exact-head review | `work-item-review` | `docs/phases/review.md` |
| Staging the exact PR payload | `work-item-publish` | `docs/phases/publish.md` |
| Executing an approved action | `work-item-approved-action` | `docs/phases/approved-action.md` |
| Report and handoff | `work-item-report` | `docs/phases/report.md` |

## Run a phase

1. Resolve the runtime as [work-item-delivery](../SKILL.md) describes, then find the existing run directory. A new Work Item with no run starts in `work-item-investigate`, which locates or creates it.
2. Run `work-item-delivery resume --run RUN` and keep its `context_hash`. When `routing.phase` names another phase, invoke that phase's skill and end this one. An explicit user request for this phase still runs only within the existing gates: say where the runtime routes, and keep every hold it reports.
3. Read every path in `routing.read`, the open corrections and the scoped pointers. Invoke the available skills in `routing.skills` and the card's conditional skills. Perform the card's action up to its stop/return condition.
4. Run `resume` again and hand off:
   - The same `context_hash` as step 2 means nothing was recorded. Stop and report the exact hold instead of invoking another skill.
   - The same phase with a new hash means more work in this phase, such as the next unit. Repeat step 3 here.
   - Otherwise invoke `work-item-<routing.phase>` in the same turn.

`await-human` routes to `work-item-align`, which shows the exact plan or payload and stops while the decision is missing. The chain never crosses an approval gate by itself: plan, publication, ticket and merge approvals stay where the cards place them, and a recorded decision is always the user's own. If a phase skill is not installed, read its card directly, continue, and say so.
