# Agent instructions

Honor existing user approval for its stated action. Reuse completed review and verification for unchanged inputs. A push of an already-tested commit does not start another delivery or design review.

| Rule | Enforcement |
| --- | --- |
| Approved actions check new blockers and execute without restarting old approval gates. | The runtime owns approved-action receipts. `npm test` in `skills/work-item-delivery/vendor/work-item-runtime` includes the routing and persistence regressions and runs in CI. |
| Every skill is listed in the README and ships in exactly one plugin: `work-item` ships every skill the setup wizard installs, and `boat` ships none of them. | `python scripts/validate_skills.py` checks all three in CI, reading the wizard's `SKILLS` tuple as the source of truth. |
| Every `boat` plugin skill has eval cases, and each case loads exactly the plugin's skills. | `python scripts/validate_skills.py` compares `evals/*/*/prompt.md` with `.claude-plugin/marketplace.json` in CI. |
