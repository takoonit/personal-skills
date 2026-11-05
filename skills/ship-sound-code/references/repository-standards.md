# Repository standards and executable guardrails

Use this workflow for explicit standards/setup work or a relevant enforcement gap. Keep ordinary delivery on the existing workflow. Scale every artifact and check to the codebase's present risk.

Choose the authorised mode before acting:
- **Audit:** inspect and report findings with evidence and proposed corrections. Keep the user's repository and remote policy unchanged; run non-mutating checks or use an isolated copy if tooling writes output. Do not execute the write/configure steps below.
- **Gate repair:** implement and verify the affected check, updating only directly related existing guidance. Do not generate a repository-wide standards package unless requested.
- **Standards setup:** apply the relevant steps below, reusing existing authorities. An approved setup already authorises its scoped implementation.

## 1. Inspect before prescribing

Read local instructions, CONTRIBUTING/architecture docs, ADRs, manifests/lockfiles, scripts, compiler/linter configuration, representative modules, tests and CI. Inspect hosted branch/ruleset policy through available authorised tools when merge enforcement is in scope. Do not confuse missing access with missing policy.

Identify language/framework versions, package manager, canonical commands, real business capabilities, entry points, persistence/external effects and current test coverage of important behaviour. Ask only unresolved questions that materially change scope, compatibility, team workflow or enforcement authority. Reuse the existing formatter, test runner and CI provider; do not install a familiar tool over an adequate incumbent.

Classify findings as observed, proposed, conflicting or unverified. Record existing failing checks separately from new failures. Do not trigger a redesign simply because a named architecture is absent.

## 2. Define the smallest architecture that explains the code

- State the major responsibilities and permitted dependency directions. For example, HTTP validation calls an application operation; domain rules avoid importing HTTP/database adapters. Use the project's actual names and exceptions.
- Group by cohesive business capability when useful. Do not mechanically regroup a working codebase or combine unrelated responsibilities because they share an entity name.
- Name each important source of truth: business rule, schema, authorisation policy, configuration and persisted state. Identify generated projections/caches and how they stay consistent. Similar-looking code is not automatically duplicated knowledge.
- Keep framework/database independence where it protects business rules. Preserve useful framework conventions; avoid generic repositories, service layers, DTO copies or DI containers without a concrete need.
- Identify critical invariants and failure paths, including applicable validation, authorisation/tenancy, transaction integrity, duplicate requests, retries, partial failures and secrets. Do not add irrelevant infrastructure to satisfy a checklist.
- Record a consequential decision with its reason, rejected alternative, cost and revisit trigger. Reuse the existing ADR convention; ordinary local choices need no new ADR.

## 3. Write concise, discoverable standards

If equivalent existing docs cover the job, extend and link them instead of creating parallel authorities. Otherwise write the two files below. Preserve casing, authored content and existing repo policy.

### CODEBASE.md

Keep the main narrative proportional to the repository, usually no more than 500–900 words; small projects can be much shorter:
1. **Purpose and scope:** product context relevant to engineering; selected versus proposed decisions.
2. **Boundaries and flow:** responsibility map, allowed dependencies, exceptions and key entry points.
3. **Sources of truth:** actual files/modules that own rules, schemas and configuration.
4. **Patterns to follow:** links to a few real canonical examples for handlers, domain operations, persistence, validation/errors and tests as applicable. Label proposed examples and create them only within implementation scope.
5. **Verification:** exact commands, appropriate test layers, CI jobs and hosted merge-policy status.
6. **Decisions and exceptions:** meaningful trade-offs, open decisions and revisit conditions.

Do not invent repository paths or claim proposed modules exist. Prefer links to source configuration over duplicated numeric settings that will become stale.

### CODE-GUARDRAILS.md

Target at most 12 enforceable statements and about 350 words or fewer. Use a compact mapping:

| Rule | Authority / enforcement | Verification state |
|---|---|---|
| [specific dependency or behaviour rule] | [source plus actual lint/test command, or named review responsibility] | [pass / fail / proposed / unverified, with evidence] |

Keep each rule observable: “domain modules must not import HTTP adapters” with a real import check is stronger than “use clean architecture”. Separate configured automated checks from human review. Record the verification context/commit when available; a past pass does not certify future edits.

Add/update one bounded engineering-guidance block in the applicable AGENTS.md or equivalent, pointing to these exact paths and canonical verification commands. Preserve any Design Guide block and unrelated policy. Create a minimal scoped instruction file only if none exists. Use markers such as `<!-- ship-sound-code:start -->` and `<!-- ship-sound-code:end -->` for idempotent updates. If writing agent instructions is prohibited, return the snippet and state it is not wired.

## 4. Implement proportionate enforcement

| Concern | Appropriate implementation |
|---|---|
| Formatting/lint | Use the language's established toolchain and current repo conventions; expose repeatable check commands. |
| Type/static checks | Use language-specific settings. TypeScript strictness is not a shared “strict mode” for Rust or Go. Stage disruptive tightening explicitly; do not silently break or suppress the existing baseline. |
| Module boundaries | Enforce meaningful forbidden imports/cycles using existing lint/package mechanisms or a justified small check. Verify actual aliases/paths rather than assuming a folder layout enforces dependencies. |
| Correctness | Test important outcomes and failure paths at the layer where they can fail. Use integration evidence for database constraints and wiring. |
| Coverage | Honour established gates. Introduce a threshold only with a justified scope/baseline; inspect which important behaviours are missing. Never add assertion-free tests to satisfy a number. |
| Local feedback | Reuse or add lightweight pre-commit checks when useful and in scope. Hooks can be bypassed and are not merge enforcement. |
| CI | Run the real checks and build as applicable, using the existing package manager/lockfile. Ensure failures propagate; inspect skip conditions and continue-on-error behaviour. |
| Merge conditions | For authorised policy setup, configure required checks through the existing branch protection/ruleset mechanism. Verify applicable branch scope and bypass rules. Otherwise report the exact pending policy work; do not claim merges are blocked. |

Do not change organisation-wide policies or unrelated branch access. A broad setup request does not authorise removing existing protections or widening bypass privileges. If remote access is missing, finish local configuration and documentation and report remote enforcement as unverified or pending.

Add a static-analysis service only for a concrete need the existing tools do not meet; account setup, maintenance and subscription costs matter. Do not require SonarQube, a second formatter, a new hook manager or a CI provider migration by default.

## 5. Verify the guards actually guard

1. Run each relevant newly added/changed check on valid code, plus the required existing checks.
2. For new enforcement, use a small disposable violating example where feasible to show the check rejects it. Prefer an isolated copy/worktree. If using temporary fixtures in the working tree, use unique names, track only files you create, ensure cleanup on failure, and confirm they are gone before rerunning the clean check. Never overwrite user changes or commit/push deliberately broken product code. For an audit, keep probes entirely outside the user's tree.
3. Check that package scripts and CI invoke those same commands and propagate failure. Local execution is not evidence of a successful hosted run.
4. Verify hosted required-check policy separately when accessible and in scope. A CI workflow file alone is not a merge restriction.
5. Confirm docs reference real paths/commands and agent pointers appear once. Report configured, passed, failing, proposed and unverified states honestly.

Bound verification to these risks. Do not run destructive external integration tests, publish or deploy simply to validate standards. Preserve an existing failing baseline as a visible finding; use a scoped migration plan rather than weakening guards to hide it.

## 6. Maintain through normal delivery

Keep the contribution/PR guidance brief: what changed and why, relevant boundary/invariant, verification and material risk. Prefer evidence to ceremonial checkboxes. Update canonical examples after intentional pattern changes; do not bless accidental drift by editing the standards.

Choose refactoring work from repeated defects, review friction, costly changes and reliability/security exposure. Agree capacity when needed; do not impose a universal 10–20% sprint allocation. For a material architecture change, use Ship Sound Code's existing decision/refactor workflow and preserve already authorised choices.
