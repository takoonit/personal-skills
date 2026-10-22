# From investigation to a reviewable specification

Use this after Work Item start safety and source-led investigation, before product implementation. It extends the existing delivery plan; it does not replace the CLI, approval receipts or repository rules.

## Choose the skills that answer the question

| Need | Skill | Result |
| --- | --- | --- |
| Explain the current flow or find the relevant code | `pstack:how` | A traced behavior and its boundaries, with code references. |
| Explain why the design exists or why a fix belongs here | `pstack:why` | Evidence-backed reasoning, labelled inference and source gaps. |
| Make the findings understandable to a colleague | `pstack:teach` | A plain explanation using the how/why findings already gathered. |
| Turn checked findings into an implementation specification | `mattpocock-skills:to-spec` | Seven sections, observable acceptance and a proposed primary testing seam. |
| Design the planned work before building | `pstack:architect` using `pstack:arena`, then `pstack:interrogate` | Compared sketches, one synthesized design and independent findings disposition before final approval and edits. |
| Diagnose a bug before choosing its fix | `pstack:principle-fix-root-causes` | Reproduction and the first wrong decision, with sibling impact and uncertainty recorded. |
| Bound the coding unit before edits | `pstack:principle-guard-the-context-window` | Scoped files, read/output budget, saved contract and concise evidence pointers. |
| Verify a code change with a matching cheap project test pattern | `pstack:tdd` | Intended failing-before and passing-after evidence, or an explicit skip and useful replacement check. |
| Clean the implementation before finish/handoff | `pstack:deslop` | A focused diff consistent with local conventions, preserving required safeguards and behavior. |
| Run approved checks and gather truthful PR evidence | `proof-of-work` | Current-source unit/regression results, authored case/blast-radius mapping, private evidence index and Proof of Works draft; conditional `pstack:swarm` for independent work. |
| Design a complex run, work without a fitting playbook, or work the user will leave running | `pstack:figure-it-out` | A falsifiable outcome, ordered verifiable units and explicit checkpoints. |
| Make an unattended or multi-phase run reviewable later | `pstack:show-me-your-work` | One append-only decision trail and an independent review of its claims. |

Read the selected skills and their platform mappings. Follow their delegation requirements and configured role models. Do not dispatch a panel merely to fill this table. `teach` reuses completed how/why investigation; it does not trigger a second investigation of the same facts. A small job needs only the relevant explanation, not every skill.

For a Work Item, explain how the reported case currently travels through the system, why the proposed boundary addresses the evidence, and what the user or maintainer will observe afterward. Keep unknown history as unknown. Reuse this material in the developer plan and specification rather than making competing versions.

After drafting the plan, follow [Design before building](work-item-design.md). Architect owns one arena; interrogate reviews the exact synthesis before implementation. Validate the external package with `scripts/check-design.mjs`, include design/review effort in realistic estimates, then show the final plan and obtain genuine approval. Recheck before branches/edits and any `start-unit` action. This is a mandatory agent-workflow step, not a retrofit of direct CLI admission. Update specs and exact publication previews after accepted design changes without fabricating approval or publishing them.

## Unattended work

The user means work they leave running. Before they step away, use `figure-it-out` to record the desired outcome, allowed scope, case/unit order, verification commands, active-work ranges, human effort, external waits, risk and checkpoint/stop conditions in the external run directory. Use the existing delivery CLI for execution state. Use `show-me-your-work` for one canonical decision log; do not create a competing execution ledger.

At each unit, record the actual evidence and one of VERIFIED, NOT VERIFIED or INCONCLUSIVE. A failed setup or unavailable source is inconclusive. Investigate the riskiest unknown first and prove a small unit before repeating it. At handoff, use `teach` to explain what changed, why, how it was checked and what remains.

Unattended execution stays within the approved developer plan. A request to leave a job running does not approve an unseen Work Item plan, a revised scope, tracker publication, deployment or destructive cleanup. When a required decision is missing, preserve the checkpoint, state the exact hold and continue only independent authorized investigation. Do not invent approval or silently broaden the job. Resume by checking the latest log, repository ownership, actual refs and approval validity. The current runtime's writer lock covers one run, not every run sharing a checkout; inspect other owners before writing.

The final trail review must be independent. Use the skill's cross-model requirement and the configured Codex mapping. If only one model family is available, record the reduced diversity and name the reviewer. If no independent reviewer can run, report that gate as blocked; passing tests do not replace it.

This guidance does not install a scheduler or start a recurring/background job. Use the host's supported scheduling tools only when the user asks for execution later or repeated execution.

## Author the semantic brief

Read the owning Work Item and its acceptance, linked business specification and relevant code. Preserve versions, exact source snapshots, reproduction, contrary evidence and access gaps in a v2 `plan.json`. Include realistic `estimates.remaining_active_ai_hours`, `basis`, `confidence` and separate `waits`. Keep per-unit estimates and human effort in that plan; the renderer does not invent them.

Write `spec-brief.json` from that investigation. This is authored reasoning, not automated extraction. Its shape is:

```json
{
  "problem_statement": "The observed problem and who it affects.",
  "solution": "The proposed observable result.",
  "user_stories": [
    {"actor": "a user", "want": "an observable capability", "benefit": "a concrete outcome", "case_ids": ["C1"]}
  ],
  "implementation_decisions": ["Describe module responsibilities and contracts without file paths or code."],
  "testing": {
    "seam": "Propose the highest useful existing observable boundary and ask the user to confirm it.",
    "case_ids": ["C1"],
    "decisions": ["Assert behavior; cite relevant prior testing patterns and affected modules."]
  },
  "out_of_scope": ["Explicit exclusions."],
  "further_notes": ["Evidence limits and unresolved decisions."],
  "source_refs": ["ticket"]
}
```

Cover every plan case with user stories and the primary testing seam. Prefer one existing acceptance seam and fast relevant regression tests. Ask the user to confirm the proposed seam before calling the specification agreed. Keep operational file lists, branch baselines and estimates in the developer plan. The specification's Implementation Decisions section describes durable design choices.

## Render and check

Run in Ubuntu WSL, using real absolute paths for the placeholders:

```sh
python3 $WORK_ITEM_DELIVERY_ROOT/scripts/draft_spec.py \
  --plan RUN/plan.json --brief RUN/spec-brief.json \
  --ticket RUN/sources/work-item.json --out RUN/spec-draft
```

Run the same command with `--check` to compare both outputs against the current inputs and captured evidence bytes. Use a new output directory after an intentional revision; the tool refuses to overwrite differing files. Identical reruns preserve existing files. Keep outputs outside the product repositories declared by the plan.

The two outputs are:

- `spec.md`, with Problem Statement, Solution, User Stories, Implementation Decisions, Testing Decisions, Out of Scope and Further Notes.
- `publication-preview.json`, with the exact proposed ADO comment and tag changes, preserved implementation holds, estimates and input/evidence hashes. No attachments or relation changes are proposed.

The checker rejects missing evidence, unread citations, changed Work Item revision, incomplete case coverage and missing estimate context. Tests seed corruption in each output, swap story assignments without changing counts and change evidence bytes without changing its URL. These checks prove consistency, not the truth of prose or the freshness of remote sources.

Rerun its bounded checks with:

```sh
cd $WORK_ITEM_DELIVERY_ROOT
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s test -p test_draft_spec.py -v
```

## Review and publication

Show the spec and exact preview to the user. Proposed publication is an ADO comment plus the `ready-for-agent` tag, preserving existing tag values. The tag is a to-spec proposal, not a verified team policy or implementation permission. Confirm the testing seam and obtain explicit approval of the exact comment, field changes, attachments and links before any write.

Refresh the live Work Item revision and tags before publication. If they differ, regenerate into a new directory and show the revised preview for renewed approval. Local hashes do not establish current remote state. Local evidence references remain local unless separately proposed and approved as attachments; make that limit visible in any published text.

The renderer has no network or tracker-writing capability and never records approval. Actual publishing remains an explicitly approved connector operation followed by read-back. Product implementation separately requires the full developer plan in chat, explicit approval and all execution holds cleared through the existing delivery workflow.
