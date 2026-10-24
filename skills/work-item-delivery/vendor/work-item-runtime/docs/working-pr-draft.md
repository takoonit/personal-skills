# Write the PR while doing the work

For a new delivery, start the private PR draft as soon as an affected repository is identified, during intake or investigation. Keep one file per repository at `RUN/pr-drafts/REPO/PR.md`, matching the grouped PR policy. The coordinator owns it; investigators and implementation workers return case notes and artifact requirements for the coordinator to integrate while context is fresh.

```sh
work-item-delivery pr-draft --run RUN --repo REPO
```

The command creates the three-section template once and returns its path and current text. Later calls read the existing draft without replacing edits. It works before `init`; once a plan exists the repository must belong to that plan. The draft lives outside the product checkout and is neither an execution ledger nor approval evidence.

## Update at the point of discovery

| Delivery step | Update in PR.md while the context is fresh | Completion criterion |
|---|---|---|
| Intake | **What Happened:** linked Work Item/case, affected user task, reported symptom and expected behavior. Label the current problem versus the intended result. | A reviewer can identify who encounters the problem and the requirement being addressed. |
| Investigation and design | **Insight:** user action, actual request/data path, cause, selected fix, rationale and material limits. Keep uncertainty explicit until supported. | The explanation accounts for why the symptom occurs and why the proposed change addresses it. |
| Before implementation | **Proof of Works:** per-case role/data/setup, exact actions and expected visible/persisted result. Name each needed before/after screenshot or log and what it must demonstrate. Reconcile that recipe with the approved `capture_plan`, assertions and checks. | The evidence collector knows which state to capture and which claim each artifact will support. Unknown setup or access remains a named gap. |
| Implementation | Update **Insight** to the actual change and **What Happened** to resulting behavior when observed. Record departures from assumptions promptly. Material changes still require the existing revised-plan approval. | The narrative describes the actual scoped change; old assumptions are corrected rather than silently carried forward. |
| Each capture or check | Update the matching **Proof** row with actual expected/observed results, executor attribution, environment/build and exact artifact links. Preserve the baseline before replacing it. | The result is attributable and inspectable; planned, failed, blocked and observed states remain distinct. |
| Review and publication | Reconcile the three sections against current cases, source and evidence. Remove resolved drafting prompts, retain honest gaps, verify accessible attachments and the full description length. Copy the reviewed text exactly into the staged payload. | The PR is a tightened account of work already recorded. Existing exact-content approval and read-back still govern external publication. |

Write the recipe before collecting evidence. For the saved Year-filter example, a planned screenshot must show the opened Year dropdown, its choices and enough employee/setup context to relate those choices to the recorded adjustment years. A page-shell screenshot or a test-total log does not answer that question. Filtering/pagination behavior needs its own action/result evidence when included in acceptance. These are evidence targets until actually executed and observed.

Use explicit labels such as `Not run`, `Blocked — access missing`, `Observed before`, and `Observed after`. A draft sentence or empty artifact filename is not a result. If the fixed build changes, review affected observations against the new head; retain old records as historical evidence and recollect what is stale. The existing plan, capture receipts and collector remain the source of execution/evidence identity.

## Preserve ownership and approval

The coordinator reads the current file and edits only the affected case/section. It incorporates worker findings on return or at a case checkpoint; parallel workers do not overwrite a shared PR draft. Keep sibling-case text and existing evidence links intact. Hand-offs identify the draft path, the last updated cases and unfinished evidence targets. Resume by reading that file and the durable run before reconstructing prose from memory.

The collector's generated `proof-of-works.md` remains an immutable input bundle for validation. Integrate its reviewed observations into the working PR's Proof section; do not overwrite the whole PR or edit the generated bundle. Test totals support the user-action account.

For an already approved publication/action, execute the authorized payload under the existing bounded preflight and read-back rules. Creating a new draft or rewriting unchanged copy is not a new shipping prerequisite. If revised copy is needed, preserve the approved version and obtain approval for that revised exact payload. This workflow never authorizes a ticket write, PR publication, merge or deployment by itself.
