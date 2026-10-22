# Agent instructions

Honor existing user approval for its stated action. Reuse completed review and verification for unchanged inputs. A push of an already-tested commit does not start another delivery or design review.

| Rule | Enforcement |
| --- | --- |
| Approved actions check new blockers and execute without restarting old approval gates. | The runtime owns approved-action receipts. `npm test` in `skills/work-item-delivery/vendor/work-item-runtime` includes the routing and persistence regressions and runs in CI. |
