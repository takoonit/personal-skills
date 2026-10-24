# Work Item Delivery

A local, resumable workflow system for a multi-case Azure DevOps Work Item. The active Codex, Claude Code or Cursor chat is the coordinator. It reads the tracker and specifications, investigates the code, prepares a dependency plan, then executes only the approved scope. The Node runtime stores cases, branch ownership, blockers, checks, reviews and exact PR approval/read-back records across sessions.

For a new Work Item, the agent automatically shows the developer plan in chat and waits for explicit approval before product branches or coding. The user only needs to supply the Work Item URL; they do not need to request the plan separately. The plan explains all cases, findings and uncertainty, solution and impact, dependencies/blockers, branch/baseline, unit tests, before/after evidence, QA/SIT ownership and realistic estimates with reasons. Changed scope, baseline or solution requires a revised plan and renewed approval.

This is built on [Lauren Tan / Poteto's pstack](https://github.com/cursor/plugins/tree/88d47514b82e7c44f00f2b2a72ff6dd12158038c/pstack). It reuses pstack's executable orchestration store, with its unit table, completion inbox, verification ledger, gates and status renderer. The adapted controller adds Work Item/specification/task traceability and enforces the grouped-repository delivery policy. See [upstream provenance](vendor/pstack/upstream.json) and [MIT license](vendor/pstack/LICENSE).

Read [the human journey](docs/human-journey.md) for what you do, what you see, what each approval permits, and how those interactions are tested.

## The operating model

Start with a clean current repository baseline unless that repository explicitly says otherwise. Read its instructions before cleanup, preserve existing work/configuration, and show the readiness result or cited exception in the developer plan. Read [repository readiness and conventions](docs/repository-conventions.md): the backend repository's live convention docs are integrated through the existing source/approval/check/review flow, while the frontend repository and other repositories keep their own rules. The runtime rejects a dirty bound directory. Do the work in the primary checkout. Add a linked worktree only when that checkout is dirty with work this delivery must not take, is on another branch, or already has the branch checked out.

One QA ticket retains numbered cases and its existing child tasks. A case may require units in several repositories. Read [business context and evidence](docs/business-evidence.md) before planning: SecondBrain skills recover business context and provenance, Confluence supplies directly read versioned business/UI/process citations, and Playwright captures actual case behavior before/after. Each unit has a concrete flow, findings with confidence, proposed change, acceptance conditions, allowed paths, executable checks and evidence-backed prerequisite edges. Shared files alone are a coordination concern, not proof of a technical prerequisite.

The default is one approved branch and one grouped PR per affected repository, including mixed feature/fix/change/chore commits. There is one active writer per repository. Blocked cases stay visible; independent implementation can continue. A repository's grouped PR remains held until all of its cases and final checks/reviews are ready. Early release or a split is a policy decision to propose before changes become intertwined, never something the scheduler silently assumes.

The runtime coordinates agents; it is not a background daemon. It does not choose models, spawn cloud agents, change Git, call tracker write APIs, merge, deploy or schedule later work. The active agent uses its authenticated tools for those separately authorized steps. `verify` actually executes the exact command argv approved in the plan and retains exit codes and logs.

Once reviewed work is approved and the user says go ahead, [check for new blockers and execute](docs/playbook.md#approval-to-action). Reuse completed reviews, including review confirmed by the user; do not add another panel, shipping verifier or approval gate. Clear ticket acceptance governs the scoped defect. Differences in other lifecycle flows do not automatically require reconfirmation or expand the fix into data repair or QA-owned SIT.

## Install and run

Requires Node 22+ and Git. There are no npm dependencies. WSL is the tested runtime on this machine; native Windows execution has not been tested.

```sh
work-item-delivery help
work-item-delivery intake --run /path/to/evidence/run --file /path/to/work-item.json \
  --url https://dev.azure.com/ORG/PROJECT/_workitems/edit/ID --revision 12
# Complete the durable investigation and design workflow first.
work-item-delivery investigate --run /path/to/evidence/run --file /path/to/investigation.json
work-item-delivery cursor --run /path/to/evidence/run
# Import independent reports, challenge, arbitrate and prepare the bound v3 plan.
work-item-delivery init --run /path/to/evidence/run --file /path/to/plan.json
work-item-delivery plan --run /path/to/evidence/run
work-item-delivery approve-plan --run /path/to/evidence/run --hash HASH --evidence /path/to/human-approval.txt
work-item-delivery next --run /path/to/evidence/run
```

New plans use `work-item-delivery.plan.v3` and require a reconciled investigation dossier plus checked design artifacts. Research records, cited business flows and per-case capture dispositions remain required. Fresh v1/v2 initialization is refused. Persisted legacy runs and already admitted writers remain continuable. Material legacy scope changes need v3 admission; sealed scope changes need a follow-up run. Use [plan.example.json](templates/plan.example.json) as a schema illustration. All example IDs, refs and results are fictional. Replace every example with directly read sources and verified repository refs. `init` refuses stale refs, missing cases, unknown sources and dependency cycles, including cycles introduced by grouped PR publication. Symlink and linked-worktree aliases of the same Git repository cannot be registered as separate repositories.

Planning is read-only against product repos. Refresh tracker revisions and target refs through the native tools before approval and execution. `origin/develop` is a local ref: the runtime cannot detect a remote update that has not been fetched. A detected baseline change holds its repository and dependent consumers; independent work can continue. Inspect the delta, revise the plan and rerun checks after integration; Git changes are explicit agent actions. Replanning invalidates the prior approval and resets units whose acceptance, cited source metadata/bytes or business flows changed, plus their dependents. Confirmed unchanged implementation can be retained, but unfinished repositories require fresh verification/review. A published repository's plan scope and receipts remain immutable while another repository is replanned; changes affecting published scope require an explicit follow-up plan.

## Investigation before a plan

Start [the working PR draft](docs/working-pr-draft.md) during investigation with `work-item-delivery pr-draft --run RUN --repo REPO`. Build its three sections as findings and evidence arrive; the planned proof tells the agent which screenshots/logs to collect. Reopening the command preserves existing prose.

Follow [the investigation lifecycle](docs/investigation.md) for exact commands and record formats. The runtime issues neutral task briefs, imports independent reports, freezes the challenge bundle and requires complete arbitration. Unresolved claims and gaps remain explicit affected-unit blockers. A reconciled dossier is evidence for planning, not implementation approval.

Pending investigation state never adopts itself. Only a successful init or explicit safe replan updates the dossier reference in delivery.json. Reports and source bytes are immutable artifacts. Per-unit evidence closure preserves unaffected implementation when another task or source changes. The host remains responsible for native dispatch, actual source reads, isolation and substantive judgment.

## Context re-entry

The [delivery skill](.agents/skills/work-item-delivery/SKILL.md) is a thin router. At startup, compaction, handoff, a new correction or phase/ownership change, run `work-item-delivery resume --run RUN`. Read its phase card and bounded source/plan/evidence/PR draft pointers, invoke the relevant available existing skills, perform the cursor action and resume again. The runtime supplies the primary action and eligible independent candidates. Use `resume --run RUN --hash HASH` to reject a stale handoff. A snapshot changes after legitimate actions; resume again instead of treating its hash as permanent authorization. The [full policy](docs/delivery-rules.md) is disclosed by phase rather than loaded into every worker.

For an adjustment, follow [alignment](docs/phases/align.md): save the exact correction, impact and what remains valid with `alignment-note --run RUN --file NOTE`; replacement needs `--hash EXPECTED_PRIOR_NOTE_HASH`. Intake creates durable pending assessment, or scoped open cases with --cases. Deliberately informational notes use --metadata-only. The coordinator scopes or reconciles records with alignment-resolve; this does not adopt scope or supply consent. Pending/open records remain visible after later notes, and hold only new work whose independence is unproven. Reconcile actual artifacts through existing replan/exact-approval rules and preserve unaffected work, owners and accepted reviews. Authorized native fresh role workers receive only bounded sources and return criteria; the runtime does not prove skill invocation, understanding, isolation, human consent or current remote facts.

`alignment-resolve --run RUN --file REQUEST.json` uses `{id, expected_revision, note_sha256, plan_hash, disposition, explanation, case_ids?}`. Take IDs/revisions/digests from `resume`. Use `scope` to assess a pending note; `within-plan`, `adopted-plan` or scoped `no-impact` resolves only selected open cases. Adoption must already exist in the persisted plan; resolution never edits or approves it. `metadata-only` and unscoped `no-impact` assess pending notes. See the [alignment card](docs/phases/align.md) for exact ordering and limits.


## Execute and resume

```sh
work-item-delivery bind --run RUN --repo backend --path /absolute/approved/worktree
work-item-delivery start --run RUN --unit U1 --owner coordinator
# Agent edits only the approved paths, runs relevant regressions, and commits if authorized.
work-item-delivery finish --run RUN --unit U1 --owner coordinator --evidence /absolute/unit-report.md
work-item-delivery verify --run RUN --repo backend
work-item-delivery review --run RUN --repo backend --file /absolute/reviews.json
```

`capture --file` records actual browser artifacts using [capture.example.json](templates/capture.example.json). Missing before evidence holds its affected UI units; missing/stale/failed after evidence holds grouped publication. `start` emits the complete worker brief and acquires repo ownership. `finish` checks the branch, clean state and changed paths. Checks run outside the shared bookkeeping lock; another repository can progress while tests run. Each result is pinned to a head SHA. A later source change requires fresh checks/review before publication. Dependencies must still have a clean approved branch, current baseline, intact implementation and the required certification. Stale or blocked prerequisites hold consumer work, checks, review and publication. Same-repository prerequisites may be certified together after all included changes are implemented. Incremental verification/review covers implemented units so a pending sibling cannot prevent review of a prerequisite; publication still requires the complete repository group.

When a unit becomes blocked, record the reason, owner and observable unblock condition. `block` refuses to release a dirty branch or committed partial implementation to other writers. Keep that ownership visible, make an explicit isolation/recovery plan, and continue other safe units/repos. An unstarted blocked case never prevents an independent case in the same repo from beginning. `unblock` requires a resolution receipt. A dead verifier can be cleared with `recover-verification` only after its process has stopped, followed by a new verification run.

On resume, use the same run directory and `resume --run RUN`; read its phase card and scoped plan, source revision, owner and blocker pointers. Check any active worker against actual session/process/source state. There is no automatic ownership takeover. Do not infer that an interrupted worker completed its task.

## Exact PR approval and read-back

```sh
work-item-delivery stage-publication --run RUN --repo backend --file /absolute/pr-request.json
work-item-delivery approve-publication --run RUN --repo backend --hash HASH --evidence /absolute/human-approval.txt
# Agent executes the exact returned payload through Azure DevOps tools, then directly reads it back.
work-item-delivery published --run RUN --repo backend --file /absolute/normalized-readback.json
```

Publication packages bind the repository, source/target, source SHA, title, complete description, draft state, approved Work Item IDs and attachment names/content. [publication.example.json](templates/publication.example.json) and [reviews.example.json](templates/reviews.example.json) document the formats. The normalized read-back must contain `status: "active"`, the actual `pr_url`, matching fields and attachment `{name, sha256, bytes}` records computed from the remote files. Keep the raw API read-back alongside it for provenance.

Human approval is evidenced by the actual user message or reviewed artifact, then recorded with its hash. The CLI binds bytes and records that decision; it cannot authenticate who wrote an approval file. Agents must never generate their own approval or infer one from elapsed time. Work Item field/comment/link mutations require their own exact-content review under the project instructions. A plan containing hyperlinks does not write links into Azure DevOps.

External writes use the session's real connectors. The runtime verifies the supplied read-back; it does not independently fetch Azure DevOps. Once recorded, a PR's URL/repository identity survives re-verification and replanning; subsequent publication must update that same PR. After an uncertain create response, read/search the current PR state before retrying. Preserve unrelated PR metadata. Publishing a PR is separate from merging or deployment.

## Execute already-approved work

After the user confirms review and says go ahead, record that actual instruction and use the approved-action path. It does not request another approval or run another review. Existing `approve-publication` receipts are reused automatically.

```sh
work-item-delivery approve-action --run RUN --repo backend --file /absolute/action.json --evidence /absolute/existing-user-instruction.txt
work-item-delivery cursor --run RUN
# Read live forge state once; retain its responses and normalize that observation.
work-item-delivery check-action --run RUN --repo backend --file /absolute/live-preflight.json
# If ready, the agent executes the returned request through its authenticated forge tools.
work-item-delivery action-completed --run RUN --repo backend --file /absolute/direct-readback.json
```

[Action](templates/approved-action.example.json) and [preflight](templates/action-preflight.example.json) examples contain fictional placeholders; replace every value with the approved PR and directly read live state. `operation` is `publish` or `approve-and-merge`. Publish requests also carry `action: create|update`, title, full description, work-item IDs and attachment paths. Draft defaults to false; an explicitly requested Draft remains true.

Preflight records are fresh for five minutes. Checks use `{id, required, state}` with state `passed|failed|pending|not-applicable|unknown`; comments use `{id, blocking, resolved}`. Other concrete new blockers use `{id, reason}`. Empty arrays mean none were reported, not that CI passed. Merge observations require an active, mergeable PR. Unknown data, changed remote head/identity, changed approved assets, new runtime blockers and unresolved required checks stop execution while preserving approval. Unrelated local checkout/worktree changes and target advancement alone do not restart review; native merge must use the returned `expected_head` condition and enforce repository policies. An invalid refresh replaces an older clean result.

For merges, normalize read-back as `status: completed`, `approved: true`, `merge_commit` and the approved PR/repository/branches/head. Confirm the commit is present on the fetched destination. Publish read-back retains the existing exact fields and remote attachment manifest. Completion is recorded separately from legacy test/review certification, so this path never manufactures missing receipts or changes initial plan-before-code requirements. The runtime remains local: the active agent performs forge reads/writes and stops the babysitter after verified completion.

## Durable state and ownership

- `delivery.json`: authoritative plan, approval fingerprints, cases, unit state, repo ownership, verification, reviews, publication and event history. Written atomically under pstack's process lock.
- `units.tsv`, `status.md`: pstack projections, regenerated from authoritative state. Do not hand-edit them.
- `inbox/`: pstack completion pointers. Results are externalized immediately.
- `sources/`: exact intake snapshots and source URL/revision metadata.
- `evidence/`: real command logs, with SHA-256 receipts.
- `gates.md`, `preferences.md`, `ledger.tsv`, `frontier.json`: upstream store structures. This adaptation uses its own per-repo readiness rather than upstream's GitHub/Origin PR-stack discovery. It does not call the upstream forge commands.

Keep one run on one host. The upstream lock uses host PIDs; sharing a run between native Windows and WSL or between machines is unsupported. Commands wait up to five seconds for normal bookkeeping contention, then fail with a retry message without stealing ownership. State files contain internal evidence: keep them local, outside product repositories and source control. A failed projection write is recoverable by `status` from the authoritative state.

## Agent playbook and verification

[System playbook](docs/playbook.md) gives intake, analysis, design, execution and publishing steps. [Harness adapters](docs/harnesses.md) map them to the available Codex/Claude/Cursor tools, without assuming Cursor-specific APIs or automatic cloud/merge behavior.

```sh
npm test
npm run check
```

Tests use temporary Git repositories and synthetic ticket/spec snapshots. They exercise the actual runtime and real local check commands. They establish local orchestration behavior, not a live Azure DevOps publication or a production fix.
