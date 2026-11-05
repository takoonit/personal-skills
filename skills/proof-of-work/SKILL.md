---
name: proof-of-work
description: Plan human-reproducible verification steps, run approved local tests and gather PR evidence with conditional swarm.
---

Read the [canonical shared skill](../work-item-delivery/vendor/work-item-runtime/.agents/skills/proof-of-work/SKILL.md). It owns the workflow, instructions and checks. Install `work-item-delivery` alongside this entry; keep run evidence outside product repositories.

## Standalone mode (no delivery run)

When there is no approved work-item-delivery run for the change (an ad-hoc fix or an existing PR), do not fake plan, approval or receipt files, and do not fall back to test counts alone. Instead:

1. Run the fixed build and walk the case's user steps in the browser, using the canonical skill's "When the UI cannot run locally" ladder if needed.
2. Capture each step's observed result, and keep the images outside the product checkout.
3. Upload the captures as PR attachments, read them back by hash, and put them in Proof of Works per `azure-pr-write`.
4. Keep supporting test results to one line, and state the Scope honestly, including any stand-in or temporary page.
