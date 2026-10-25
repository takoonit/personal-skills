# Rules and their enforcement

The procedure lives in the `work-item-<phase>` skills. This table lists the rules the runtime enforces in code, each with the test that fails when the rule breaks, so the skills do not restate them. A rule with no test here is a judgment call and lives in its phase skill.

| Rule | Enforcement (runtime test) |
| --- | --- |
| Product work starts only under the approved current plan fingerprint. | `start safety approval guard rejects missing mismatched and stale fingerprints`; `plan approval is a human stop`; `H1 human journey: withhold, revise, then approve the displayed implementation` |
| A plan needs an executable unit-test plan or a justified exception. | `approval requires an explicit executable unit-test plan or a justified exception` |
| Bug branches use the configured `fix/` prefix, never `codex/`. | `Bug approval rejects codex branches even if a stale plan asks for that prefix` |
| A plan covers every case, cites its sources and groups one PR per repository. | `case coverage, source references and same-repo PR grouping are structural` |
| Dependency and grouped-publication cycles are refused. | `real dependency cycles and same-repo publication dependencies are rejected`; `grouped publication cycles are rejected even when unit dependencies are acyclic` |
| Fresh plans need v3 admission with a reconciled dossier and checked design. | `fresh legacy init is refused; persisted v2 actions and same-input continuation retain authorization`; `design bytes bind approval and new writers without preventing active writer completion` |
| Unresolved gaps and challenges block every affected unit; independent work continues. | `unresolved gaps and challenges block every affected unit while independent work starts`; `blocked sibling does not block independent implementation but holds grouped PR` |
| A bound workspace must be clean; existing work is never discarded. | `execution starts clean without discarding existing tracked or untracked work` |
| One writer per repository, across processes and aliases. | `only one writer per repo, while another repo can progress`; `repository ownership is enforced across independent CLI processes`; `symlinks and linked worktrees cannot create a second repository writer identity` |
| Dirty or partial work cannot be released to another writer. | `uncommitted partial changes cannot be released onto a shared branch`; `committed partial work cannot silently release the shared repo writer` |
| Changed sources, conventions, acceptance or baseline invalidate approval and reset affected units. | `changed cited repository conventions invalidate approval before coding`; `replanning changed acceptance resets affected units and their dependents`; `moving target baseline blocks affected repo only` |
| UI work needs real before evidence; publication needs current-head after evidence. | `missing before capture holds only affected UI work; real artifact receipt unlocks it`; `passing after evidence requires the current head and every planned observation` |
| `verify` runs only approved argv, and a result binds to its head. | `a rehashed log must still match the approved command and recorded exit`; `a later head rejects an earlier review receipt` |
| Failed or partial test output never certifies. | `failed executed checks remain failed, never certify implementation`; `zero-exit no-op is command success but never complete unit-test proof` |
| A correction holds new certification until reconciled. | `a correction arriving during verification prevents a new pass receipt`; `default CLI correction survives restart and blocks direct starts until explicit assessment` |
| Publication binds the exact payload and bytes; revised copy needs new approval. | `H3 human journey: implementation approval and revised PR publication are separate decisions`; `changed approved evidence and attachment bytes cannot authorize another external write` |
| A recorded PR identity survives; later publication updates the same PR. | `re-verification retains PR identity and rejects duplicate create or mismatched update read-back`; `published repository records survive replanning and completing another repository` |
| An approved action checks only new blockers, then executes without new approval. | `an explicitly approved action checks only new blockers before execution`; `existing exact publication approval is reused without requesting it again` |
| Unknown live data or a stale preflight never counts as clear. | `unknown or malformed live data cannot substitute for checking blockers`; `failed refresh invalidates an earlier clean preflight rather than retaining permission to execute` |
| A merge completes only for the approved identity, with read-back. | `source, destination and PR identity drift never authorize a different merge`; `completion requires actual approval, Completed state, the approved patch and a merge commit` |

The runtime binds bytes and relationships. It cannot prove human consent, skill invocation, worker isolation, semantic correctness or current remote state; the phase skills own those judgments.
