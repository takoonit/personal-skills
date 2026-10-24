---
name: proof-of-work
description: Run approved local verification or collect and validate existing test evidence for a private PR Proof of Works draft, using swarm when independent work benefits.
---

# Proof of Work

Read [the operator guide](../../../docs/proof-of-work.md) before using `scripts/proof-of-work.mjs` from the shared work-item-delivery checkout. The guide defines scope JSON, modes, evidence limits and output handling. Preserve existing plan, execution and publication approval gates.

Before collecting evidence, read the repository's [working PR draft](../../../docs/working-pr-draft.md). Its planned Proof of Works must identify each user-action scenario, expected result and the screenshot/log content needed to support it. Reconcile those targets with approved capture/check records before execution. Return actual observations and exact artifacts to the coordinator after each case so it updates that row while context is fresh. Keep generated collector bundles intact; integrate reviewed evidence into the working draft rather than replacing its earlier sections.

Trace the changed behavior and callers, inspect the real assertions, then select narrow meaningful unit/regression checks from the approved plan. Record an authored per-check case map, environment and one blast-radius safety fact supported by an exact executable check. Preserve actual before/after observations and test identity when available; missing behavior proof stays a reported gap. Do not infer counts, acceptance or semantic coverage from exit zero or a passing case map.

For evidence planning and PR writing, read [Plan evidence a human can repeat](../../../docs/human-verification.md). Apply `mattpocock-skills:wizard`'s scoping/journey method: setup and exact entry point, baseline actions, the same fixed-build scenario, downstream verification and linked expected/observed results. Reuse existing plan/capture receipts; identify the actual executor. Separate automated/unclassified support from product-action records. Bind product observations to the approved procedure digest and hashed execution transcript; UI also resolves the actual latest matching capture receipt. API/CLI journeys do not need UI screenshots. Human-reproducible instructions do not imply human execution. Generate a Bash wizard only for useful, concrete human-required actions, not ordinary tests the agent can perform.

Use `--execute` only for actual approved checks through `Delivery.verify`; default collection and `--check` run no tests. Put all outputs outside product checkouts. No automatic publication, AI SDK or scheduler is part of this workflow.

## Choose direct execution or swarm

Work directly when there is one short job or coordination would add no useful coverage. Use `pstack:swarm` when approved independent repository verifications or separate read-only source/evidence/blast-radius investigations materially help. Read that skill and its Codex mapping before dispatch; follow all four phases below.

### Frame

Open a task list for Frame, Fan out, Aggregate and Report. Declare the required slices and done predicate: every required slice returns source-bound evidence or a visible gap, every returned execution bundle passes independent collector validation, and unsupported claims are removed. Prefer partitioned slices; declare the selection rule first if racing alternatives.

Use the configured `swarm workers` role from applicable instructions or `pstack-models.md`, including its effort/default effort; here the configured role is `gpt-6.1-sol` with default `medium`. Follow the swarm skill's documented fallback only if configuration is absent or the model is rejected, and report the fallback.

Name exact tool and target repository heads, relevant uncommitted file hashes, run/repository IDs, allowed scope, verification method and required return artifacts in every standalone brief. For measurements also specify sampling method/order. Require workers to return those identities, method, paths and `PASS`, `ISSUES` or `BLOCKED` with concrete evidence.

Give each writing worker a distinct private output directory and ownership; keep shared source read-only. Independent repositories may execute concurrently only when their dependencies and external resources are independent. Serialize same-repository verification through existing runtime ownership. Isolate shared databases, ports and report files or run those jobs sequentially; separate output folders alone do not isolate them.

### Fan out

Dispatch the planned independent workers using the platform mapping and configured role. Each brief names the exact approved CLI invocation or read-only review method, output owner and done predicate. Workers may not invent approval, change approved commands or publish. Required slices remain required if a worker drops out.

### Aggregate

Read every terminal result. Reject reports missing their named source identities or method and respawn once, as the swarm skill requires; a second miss remains a gap. No absent, failed or unsupported required slice counts as a pass.

Independently inspect every actual returned `evidence-index.json` and `proof-of-works.md`, then run the collector with that worker's exact run/repository/scope/output and `--check`. Check its exit and gaps as well as file existence. Independently compare current target heads/tool hashes with the brief and bundle; investigate drift rather than reuse stale results. For read-only review slices, verify source references and exact check/test claims against the source; they do not replace an execution bundle.

Inspect the named assertions behind each authored mapping and blast-radius fact. Hashes authenticate bytes, not behavior judgments. Retain failed-before artifacts and test revision identity; missing before/after observations remain an explicit acceptance gap even if collector execution status passes. Omit unsupported coverage or environment claims.

### Report

For the PR, turn verified case journeys into concise instructions a human can repeat, with observed before/after outcomes, artifacts and supporting automated results. Keep the collector bundle intact and write the full three-section PR separately; the generated summary and `CHECKS_PASSED` do not certify walkthrough completeness. Apply the guide's evidence, link and complete-description checks before existing publication approval.

Return one consolidated table of slices, source identities, methods, results and local bundle paths, with concrete issue one-liners, gaps/dropouts and any declared race rule. Separate passing recorded checks from authored observations and unverified acceptance/SIT/deployment. Keep raw private artifacts local; publication needs its existing review and approval workflow.
