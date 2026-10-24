# Business context, citations and browser evidence

This is the evidence contract retained in v3 plans and persisted v2 runs. Research precedes dependency design; browser capture starts during investigation and continues after implementation. These are work stages owned by the active agent, with durable runtime receipts.

## Research the business flow

Use the available SecondBrain skills: `wiki-query` for read-only retrieval, and `think` when requirements or business meaning conflict. Read each skill before use. Orient with hot/index, check retrieval capability, query the verified index, and fall back to bounded text search when it returns no adequate result. Read the actual notes and relevant claim/source ledger entries. Record note path and heading, update date, claim status, underlying source locator/version and any provenance gap. A note summarizing a source is not an independent corroborating source. Vault writes remain a separate operation through its save/ingest skills and the user's authorization.

Follow Work Item and note links into Confluence through the authenticated connector. Read the exact page version and section, including process/sequence diagrams and UI rules, rather than relying only on API shapes. Search boundedly for the actor, screen and business operation if links are incomplete. Record empty containers, inaccessible pages, stale snapshots, conflicting rules and rejected candidates. An empty page has been read, but it supplies no business rule. Keep the authority decision: ticket acceptance, design intent, observed source behavior and deployed behavior remain separate claims.

For each case, model **actor → trigger → preconditions → user action → business rule/state change → outcome**. Cite each step using the preserved source IDs and their section/version locators. Then connect that business flow to the technical request/service/data/response flow. This catches an implementation that satisfies an endpoint while violating the user's task.

In v2 and v3 JSON, `knowledge.second_brain` and `knowledge.confluence` record `status` (`read` or `gap`), `query`, `summary`, `source_refs`, plus `gap` when applicable. Sources identify their provider with `kind: "second_brain"` or `"confluence"`. `knowledge.business_flows[]` contains `id`, `case_ids`, `actor`, `trigger`, `preconditions`, `steps[{action,business_rule,source_refs}]`, and `outcome`. Every case needs a cited flow. Gaps are visible planning inputs: block conclusions that need missing evidence, rather than manufacturing a citation or blocking unrelated cases.

## Keep business questions within the ticket

Use the ticket's explicit acceptance and the user's latest approved scope for the affected flow. Compare rules for the same actor, trigger and state before calling sources contradictory. A creation grant and a termination recalculation can have different rules; that difference alone does not require reconfirming the termination requirement or changing creation.

Before raising a business question as a blocker, identify the exact missing or conflicting in-scope decision and explain why the approved fix or its verification cannot proceed without the answer. If the ticket already specifies the result and the fix can preserve other flows, retain broader lifecycle questions as impact notes or separate follow-up work. Investigate a concrete regression on its evidence; do not turn an unproved concern into new acceptance criteria.

Assess review concerns against this scope test rather than copying them wholesale into mandatory plan amendments. A user-requested scope change or release condition still applies, but later user clarification supersedes an earlier hold. Reconcile stale blockers with the ticket and current instruction instead of asking the user to approve the same requirement again.

Historical-data repair, test-data patches, new settlement rules and QA-owned SIT are separate obligations unless explicitly part of the approved delivery or an enforced repository policy. Their absence is not proof that the scoped code fix lacks a business requirement.

## Plan and capture observable evidence

Use the available Playwright skill and its actual installed runtime. Detect configured dev ports as well as defaults; identify the application before interacting with it. An unrelated server is not the requested app. Run the relevant build locally for screenshots. The runtime requires a loopback URL and an explicit local-fixture/local-real-data/local scope; Use the actual repository app/components, not a separate unrelated prototype prototype or remote screenshot target. Start the isolated local baseline/fixed app or the actual-component harness when needed, then use its source build, role, locale/timezone and suitable employee/test dataset. Reuse an authorized session through supported browser tooling; if access or a test person is missing, record the blocker and keep other investigations moving.

Each UI case has a `capture_plan` entry: `id`, `repo`, `case_ids`, `tool: "playwright"`, `environment`, `url` (fixed build), optional `before_url` (isolated baseline on another local port), ordered `steps` and observable `assertions`. Keep entries granular enough that one inaccessible case does not unnecessarily hold independent case investigation. A backend-only case can use `tool: "not-applicable"` with the reason and appropriate API/test evidence. A case with affected UI needs browser evidence even when part of its fix is backend code.

- **Before:** reproduce or record the actual baseline behavior and its limits. Capture the relevant dropdown/interaction, not just the page shell. Retain screenshot and useful DOM, network/response summary, console output and trace. Record missing data/access or inability to reproduce honestly.
- **After:** repeat the same scenario against the tested source head; show the corrected options and applied Search/table result, plus relevant edge/error behavior. Each planned assertion gets the expected value, actual observation and pass result. Store the source SHA and build/environment evidence. Unknown deployed build identity cannot certify the current Git head.
- **Blocker:** retain the actual access/capture error, trace or network/console output, affected cases, owner and unblock condition. An access screenshot, login page or empty screen does not satisfy before/after case evidence. When screenshot capture itself fails, retain the failure and other artifacts; no screenshot is invented.

Write a JSON receipt using [capture.example.json](../templates/capture.example.json), then run:

```sh
work-item-delivery capture --run RUN --file /absolute/capture.json
```

The runtime validates metadata and artifact bytes, hashes the original receipt/artifacts, and binds them to the plan fingerprint. It cannot authenticate that the agent used Playwright or that a supplied SHA is the server's build; preserve script/run output and direct build evidence for review. `start` holds the affected UI unit until its before evidence is recorded. Grouped publication requires before evidence and passing after evidence for the current repo head. A chronologically newer failure/blocker, changed bytes or changed case/source contract removes the corresponding readiness. Unrelated replanning retains intact historical before captures; after certification is renewed for the current plan/head. Reviewers inspect what the evidence shows, not just the receipt's verdict.

## Test and evidence completion gates

Every developer plan explicitly states both unit-test and evidence-gathering work. Each unit has `unit_test_plan: {check_ids, assertions, before, after}` linking real checks and behavior cases, or `{reason}` for justified non-applicability. New approval is refused when this disposition is missing; existing approved runs remain readable. `plan` displays the assertions, exact check argv and before/after proof so these steps cannot disappear from the review. For a behavior fix, retain the intended assertion failure before the production correction, then passing focused tests and the complete affected local test files. A setup/import failure is not a reproduced defect. Explain relevant failures/skips and bind results to source identity.

Gather evidence during investigation, before implementation, during red/green tests, and after implementation. Retain versioned requirement/cause references, source/build and fixture identity, actual commands/logs/exit codes/counts, before/after browser artifacts for UI cases, and per-case expected/observed results with artifact paths. Hash only files actually produced. Missing artifacts stay gaps; old filtered passes, page shells and helper-only checks cannot certify a complete flow. Explicitly label mocked UI responses separately from backend execution.

Record verification ownership. When the user assigns SIT to QA, do not seek SIT access or treat its absence as a developer prerequisite; use approved local tests and actual-component fixtures, then hand QA the unverified deployed scope/response/button/lifecycle checklist. A local fixture never proves SIT acceptance. Handoff to QA and SA explains each change/finding, its reason, supporting evidence, impact and remaining limitations. Separate active AI execution estimates, human effort, waiting and deployment; report concrete causes when estimates change. This instruction does not waive local before/after capture requirements.

## Review and PR evidence

Review against **case → task → business rule/citation → technical change → automated checks → browser observation**. Cite the actual note heading and versioned Confluence section in the plan; use the underlying primary citation in PR text where it supports the behavior. Keep screenshot captions compact: case/scenario, environment/build, before or after, expected and observed result. Preserve restricted raw captures; crop unrelated person data before exporting evidence. A local fixture and a local run against real data keep their own labels. Prior remote observations remain separately cited research, never local screenshot proof.

Anti-patterns: using SecondBrain hot/index as proof; inventing cell/page citations; treating old notes as current deployment; citing an empty UI container as a requirement; describing only an endpoint instead of a business flow; screenshots without the dropdown or applied result; a mock presented as SIT; old-head after evidence reused for a new head; and a missing capture relabeled as successful validation.
