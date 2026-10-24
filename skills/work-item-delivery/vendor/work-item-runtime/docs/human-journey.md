# Deliver a Work Item from your point of view

You supply the Work Item and constraints in chat. The agent handles source collection, research assignments, runtime commands and evidence files. You review the proposed behavior and make the decisions that require your authority.

This page describes the workflow operator's decisions. For the product user's actions and the Work Item behavior that PR evidence must demonstrate, use [product-user verification](human-verification.md). Both perspectives are needed; approval tests do not establish product acceptance.

| Moment | What you do | What the agent shows you | What happens next |
|---|---|---|---|
| Start | “Investigate WI 100. Preserve my existing work.” | Understood cases, sources it could read, missing access and current repository constraints. | The agent investigates and prepares the plan. Product edits wait for plan approval. |
| A decision is missing | Answer the specific question, provide access, or leave that case blocked. | The conflicting statements, source links, affected cases, owner and smallest observable unblock condition. | Independent work can continue within approved scope. A guess or an agent vote cannot supply missing authority. |
| Review the plan | Approve the displayed plan, request a concrete revision, or withhold approval. | Expected behavior per case, findings and uncertainty, proposed changes, design rationale, affected paths, dependencies, tests, evidence, estimates and QA/SIT ownership. | Approval admits that exact implementation scope. A requested revision produces a new plan for your review. |
| Implementation | You can ask for progress or correct the requirement. Routine agent steps need no repeated approval. | What works now, expected versus actual results, evidence links, remaining blockers and any decision needed from you. | Unchanged approved work continues. Material scope/source changes return affected work to a revised plan and renewed approval. |
| Review publication | Approve the exact PR payload, request copy changes, or leave it local. | Repository and branches, current head, title, full description, draft state, Work Item links, attachments and proof with environment limits. | Only the approved external action runs. Plan approval alone does not authorize publishing, ticket edits, merging or deployment. |
| Handoff or resume | Ask what remains, or authorize a specific next action. | Local implementation, verification, external read-back and QA/SIT/deployment status separately, with owners and evidence. | Existing applicable approvals are reused. New blockers are checked once before the already authorized action. |

## Example: one case is unclear

You ask to fix two filtering cases. Research confirms A, but the ticket and specification disagree about B.

The agent explains the actual disagreement: “For B, the ticket says inactive rows are hidden; specification revision 3 says they remain visible. Which behavior is authoritative? B is blocked with BA as owner until a cited decision is available. A can proceed if you approve its displayed plan; the grouped PR remains held for B.”

You can leave B blocked and approve the displayed A scope. That decision permits A's implementation and tests, while B stays visibly blocked. If you supply a cited answer later, the agent reconciles it, shows the changed plan and asks for approval of the changed scope. It preserves applicable completed work.

“Investigate it,” silence, and “revise B first” leave implementation unapproved. “Approve this plan” authorizes the displayed implementation. “Publish this exact PR” authorizes the displayed publication. The agent records your actual instruction and continues once the corresponding conditions hold.

## How explanations and tests use this journey

Explain a workflow through the person's goal, their action or decision, the information they see, and the resulting behavior. Describe internal commands only when they help the person reproduce a check or understand a limitation. At a decision point, show the concrete reviewable content before asking for a decision.

For verification, state the starting situation, simulated human action, visible output, expected result, observed result and evidence. Check refusal and correction paths as well as approval. These automated scenarios exercise the actual CLI and disposable local Git repositories:

| Scenario | Human action being simulated | Observable acceptance |
|---|---|---|
| H1 | Withhold approval, request a revision, then approve the revised plan. | The plan explains the decision and its scope; start is rejected before approval and against the previous hash; unchanged product files remain untouched; the current plan can then start. |
| H2 | Leave an unanswered case blocked while approving independent work. | The displayed plan identifies the question, owner and unblock condition; the affected case cannot start; independent approved work can proceed; grouped publication stays held. |
| H3 | Approve implementation, request PR copy changes, then approve the revised publication. | Implementation approval leaves publication unapproved; the full staged payload is inspectable; approval of the previous payload is rejected; exact revised approval admits only that publication and is reused on resume. |
| H4 | Ask for progress while an admitted writer is active and design metadata has changed or disappeared. | The displayed plan says the writer can finish or safely park under its existing approval; new work still requires reconciliation of changed inputs. |

The automated decisions and design/review reports are synthetic fixtures. These tests establish visible CLI output and state transitions. They do not prove that an agent presented the right chat message, that a real person understood it, or that a live tracker/PR action succeeded. A human walkthrough should use an actual Work Item, review the chat at each decision, and check its real evidence before claiming those outcomes.

At approval, the plan also shows pending/open corrections, preserved/reset unit IDs, historical implementation limitations/gaps, and whether verified design panels were reused from an original context. Read these with the exact current plan hash. A retained legacy implementation is not retroactive independent investigation, and reused panels did not execute against the revised plan.
