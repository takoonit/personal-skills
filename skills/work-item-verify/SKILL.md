---
name: work-item-verify
description: "Work Item phase skill for checks and evidence. Checks the locked Red tests, runs the approved checks and captures on the current head, and records human-reproducible evidence through proof-of-work."
---

# Work Item verify

Run inside the [chain](../work-item-delivery/SKILL.md). The runtime card `docs/phases/verify.md` is the contract.

1. Finish the repository's writer first. Verification runs on a clean committed head.
2. **Red lock.** For each unit with a locked Red commit, run `node SKILL_DIR/scripts/red-lock.mjs --repo PATH --red RED --tests PATHS` from the installed `work-item-delivery` skill. ISSUES sends the unit back to `work-item-implement` to restore the tests; never edit the tests to match the code.
3. Run `work-item-delivery verify --run RUN --repo REPO`. It executes only the approved argv and pins logs to the head. Run long checks in the background (Claude Code: Bash `run_in_background`) and keep other repositories moving.
4. For UI cases, use the installed browser skill on the tested head, repeating the before scenario. Record `templates/capture.example.json` with the actual image framing, then run `capture --file`. Each planned assertion records expected, observed and pass. A login page, page shell or empty screen is not evidence.
5. Invoke `proof-of-work` to validate bundles and draft Proof of Works rows. For independent repositories use `pstack:swarm`. Each worker owns a private output directory, records the exact head and method, and returns PASS, ISSUES listing every defect, or BLOCKED. Drop a result missing its head or method and rerun that worker once; a second miss is a gap.
6. Update the repository's PR draft proof rows now, with environment, executor and artifact links.

## Rules

- Never change approved argv or add checks to reach green. Exit codes and test counts prove execution, not acceptance, SIT or deployment.
- Retry once: rerun a failed check only when setup failed before any test ran. A second failure is real and returns to implement with its output.
- A check that also fails on the baseline is recorded as pre-existing, with its evidence, and does not return to implement. Record before and after capture scope honestly.
- A setup failure is inconclusive, not a regression. Clear a crashed verifier with `recover-verification` only after its process is confirmed dead, then rerun.
- Keep product actions (executor, approved procedure, UI, API or CLI receipt), automated checks and unclassified records separate. A local fixture never certifies SIT; QA-owned SIT becomes a handoff checklist.
- A correction that arrives during verification holds certification until `work-item-align` reconciles it.
- Stop broadening once the relevant checks pass.

Read when needed: `docs/business-evidence.md` (evidence gates), `docs/human-verification.md`, `docs/proof-of-work.md`.
