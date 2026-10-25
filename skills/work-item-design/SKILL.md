---
name: work-item-design
description: "Work Item phase skill for design and plan authorship. Runs architect, arena and interrogate on the reconciled dossier, binds the v3 plan with its locked Red tests, and shows the concrete developer plan for approval. Never edits product repositories."
---

# Work Item design

Run inside the [chain](../work-item-delivery/SKILL.md). The runtime card `docs/phases/design.md` is the contract. No product branches or edits.

1. **Units.** Build the v3 plan from the reconciled dossier with `templates/plan.example.json`, replacing every fictional value with live evidence. Each unit is a verifiable case and repository change: flow, finding and confidence, change, acceptance, allowed paths, checks and `unit_test_plan` (check IDs, assertions, failing-before and passing-after, or a justified reason). Where a cheap behavioral test seam exists, name the unit's **Red tests**: the paths and assertions a separate test author writes before the code.
2. **Dependencies.** Add an edge only for a concrete prerequisite, naming its stage: implementation, verification, review or publication. Shared files need one writer, not an edge. Remove cycles, including grouped-publication cycles, with a smaller shared contract or an owner decision. Set `priority 0..3` from documented risk only.
3. **Branches.** One branch and one grouped PR per Work Item per repository, with focused case commits. Read `work_item.type`. A Bug uses `fix/<id>-<slug>`, never `codex/`; other types need an explicitly resolved prefix. Pin each repository's verified target ref and SHA. A blocked case holds its repository's PR, so propose any split or early release before coding.
4. **Design.** Run `pstack:architect`, whose one `pstack:arena` uses the configured architect runners and a cross-judge from the pool. Then run `pstack:interrogate` on the selected sketch and rationale with every configured seat. Classify each finding as Act On, Consider, Noted or Dismissed, and resolve every Act On before approval. Do not let architect continue into implementation. Validate with `scripts/check-design.mjs` (`docs/work-item-design.md`), resolving `inherit-parent` seats in a labelled snapshot. A missing seat is incomplete; one model never stands in for several.
5. **Estimates.** Follow `work-item-start-safety`: active AI range with its basis, human effort and owner, waits with unblock conditions, and confidence. Elapsed time is the critical path plus waits.
6. **Admit and show.** Run `design-context`, `init`, then `plan`. Show the full plan **in chat**: every case, root cause or uncertainty, solution and reasons, affected repositories, paths and behavior, baseline and exact branch, dependencies, blockers and owners, Red tests and checks, before and after evidence, QA/SIT ownership, estimates and publication holds. A file or tool output does not count as showing it. Update the PR draft's Insight.
7. **Approval.** Ask for approval of that plan hash (Claude Code: `AskUserQuestion` after the plan is shown) and record the user's actual words with `approve-plan`. If the user already approved this exact plan, record that instead of asking again.

A changed scope, baseline or solution needs renewed design and approval. An unchanged valid design package is reused.

Read when needed: `docs/work-item-design.md` (manifest), `docs/business-evidence.md` (capture plan), `docs/work-item-spec.md`.
