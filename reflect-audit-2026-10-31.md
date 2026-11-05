# Reflect + workflow audit — personal-skills (2026-10-31)

## Accepted

| # | Problem | Proposal | Routing |
|---|---|---|---|
| 1 | The PR's Proof of Works put test counts next to QA's bug screenshot, which the user read as "nothing was tested" and corrected to "use only after" (b574ec9a 10:23, 10:35). | Bring in the `1b87929` Proof of Works paragraph: real browser captures of the fixed build, one per user step, After only unless Before is asked for, tests in one supporting line, and never the bug image. | `skills/azure-pr-write/SKILL.md`, Write, Proof of Works paragraph (line 32), cherry-picked from `1b87929` |
| 2 | "Let me review the PR" got a local diff instead of a PR. | Bring in the `1b87929` rule (push the branch, create a draft PR, give the link, stop) and its trigger phrases "review PR / open a PR". | `skills/azure-pr-write/SKILL.md`, description and Write section, from `1b87929` |
| 3 | Images never reached the PR ("it only show (screenshot: …)"), and agents went through browser-tab `fetch` and `location.hash` workarounds or asked the user to attach images by hand (bd48c9c0, f549def9). | Bring in the `1b87929` REST-with-PAT fallback. Add one line: when the MCP has no PR-attachment tool, upload through the PR attachments REST endpoint, embed the returned URL, then read the description back and confirm the image URLs resolve. Mark the curl route untested. | `skills/azure-pr-write/references/azure.md`, Transport bullet |
| 4 | Working Thai copy was rewritten, shipped to SIT and reverted (f549def9 16:06). The PR never said whether that message already existed before the PR. | Copy the installed-only line into the repo: "for each message, language or rule the change touches, say whether it already existed (source PR or commit) or this PR changed it." | `skills/azure-pr-write/SKILL.md`, Write, What Happened (copy from `~/.agents/skills/azure-pr-write/SKILL.md:28`) |
| 5 | `proof-of-work` refused to run without a delivery run ("I didn't fake one", b574ec9a 10:23). Standalone mode exists only in the installed copy. | Bring in the `1b87929` "Standalone mode (no delivery run)" section. | `skills/proof-of-work/SKILL.md`, new section from `1b87929` |
| 6 | Replies saying "no change needed" or "out of scope" restated the result without showing anything ("those are claims, not proof", bd48c9c0 10:17, 06:51). | Add a drafting rule: a reply that declines, disputes or says no change is needed links something the reader can open (failing-before and passing-after log, screenshot, code line) plus any follow-up ticket. Also bring in the `1b87929` QA/BA trigger phrases. | `skills/clear-tactful-writing/SKILL.md`, Drafting workflow step 2 and description |
| 7 | The agent posted, as a waiting question, an assumption that was already being implemented, and it named an invented "team" ("what team?", "just put it there as note", "In english then", 703648c5 12:57–13:01). | Add a rule: when work already proceeds on an assumption, write a short English "Note: implementing with this understanding", not a question, and name only real actors. | `skills/clear-tactful-writing/SKILL.md`, Formal or high-risk writing, or Drafting workflow |
| 8 | None of the 24 sessions invoked `work-item-delivery` for "WI <id> break down… root cause… solutions" prompts. The repo description lacks the trigger phrases that the installed copy and `1b87929` have, and "break down a ticket" collides with `clarify`. | Restore the `1b87929` phrases, add "report the cause and solutions before building", and take the phrase "break down" away from `clarify`. See audit A3: this alone will not fire. | `tune description: skills/work-item-delivery/SKILL.md` |
| 9 | Reflect edits were applied to installed copies ("applied all 9 edits to the installed skills", 99f92091). "Port to repo" then put them on a side branch that never merged. | Rewrite §5 Apply: edit the canonical git repo on its current working branch, reinstall from it, and report the commit. Drop the Cursor copy-and-edit paths. | `~/.agents/skills/reflect/SKILL.md` §5 Apply, lines 53–58 (reflect is not in the canonical repo; add it there too) |
| 10 | A bare "ok" to a 7-row table was taken as approval of every row, and the user then asked whether that would "contaminate" a skill's scope (d47e4a17). | Reword line 49 so it fires: a bare "ok" or "go" to a multi-row table is not row approval; ask which row numbers. | `~/.agents/skills/reflect/SKILL.md` §5 Apply, line 49 |
| 11 | "Promote to SIT and update the Work Item and QA" recurs in at least 3 sessions and no skill owns it. The develop-before-SIT order was violated (b574ec9a 14:11), and the agent held the QA update trying to reach the site instead of reading the pipeline (13:55). | Draft a generic promotion skill: source PR merged and its pipeline green → promotion branch from the environment branch → cherry-pick → PR and merge → deploy stage green means "online" → Work Item state change and QA comment under exact-content approval. Branch names and stage names come from per-repository config (audit A4). | `new skill via create-skill: work-item-promote` |

## Rejected

- **Principle:** Reply on the Work Item, open a ticket covering every affected screen, and link it when QA reports a defect caused elsewhere (judgment 10).
  **Reason:** skill-not-used. `work-item-investigate` was never invoked. The evidence-and-link part is merged into row 6, and the workflow part is in audit A12.
- **Principle:** Research before asking, and treat reversible gaps as stated defaults (judgment 5, judgment audit 6).
  **Reason:** already-covered. `skills/clarify/SKILL.md` §5 states it, and `clarify` was never invoked. The gap in investigate is audit A9.
- **Principle:** Send nothing when nothing is left to decide, and list no exclusions the ticket did not hint at (judgment 6, divergent 8).
  **Reason:** skill-not-used. `clarify` was authored in b410135e and never run. It is uncommitted, so fix it before commit (audit A13).
- **Principle:** Do not rewrite working user-facing copy, and never produce Thai by translating English structure (judgment 8).
  **Reason:** skill-not-used. The rewrite happened under `claude-mem:babysit`, and `work-item-implement` was never used. The rule is already in project memory `dont-rewrite-working-thai-copy`, and the PR-side half is row 4.
- **Principle:** Drop out-of-scope reviewer findings by default, and put incidental fixes in their own PR (judgment 9).
  **Reason:** skill-not-used. `work-item-review` was never invoked, and the `code-review` skill that was used lives outside this repo. Merged into audit A12.
- **Principle:** Cap test workers on a RAM-starved host (judgment 12, tooling 7).
  **Reason:** durability. These are host-specific numbers, already in memory `use-pnpm-locally`. The generic memory gate is in Backlog.
- **Principle:** Use pnpm locally, and `azure-change-record:54` conflicts with that (tooling 7).
  **Reason:** specificity. It is a repo-local preference already in project memory. There is no conflict: line 54 says commands come from the repository, which pnpm satisfies.
- **Principle:** Hard-coded optional reviewer identity id and org REST URLs (tooling 2, 4, 5).
  **Reason:** specificity. Org identities and URLs belong in per-repository config or project memory (`pr-optional-reviewer-panupong` already exists), not in shared skills.
- **Principle:** Global-install and PAT setup for the Azure DevOps MCP, plus reconnect limits (judgment 13, tooling 1, 3).
  **Reason:** structural. This is setup docs and a startup check, not skill prose. It is audit A8, and the generic fallback is row 3.
- **Principle:** Windows plumbing facts: junctions, unread-file Edit, image size, the uv assertIn failure (tooling 11).
  **Reason:** specificity. These are hyper-specific, one-off facts.
- **Principle:** Read PRs, threads, comments and identity ids yourself rather than taking pasted context (tooling 12).
  **Reason:** decision-changing. Every case is a singleton, and the agents did read through the MCP whenever it was up.
- **Principle:** The cross-run writer guard reads a fork as "own" (divergent 5).
  **Reason:** convergence. It is unverified: no `work-item-delivery` run existed in the corpus, so `run-conflicts.mjs` could not have been involved. Kept only as an untested hypothesis in audit A14.
- **Principle:** "Promote to SIT" as a fixed humi sequence with branch names inside a skill (judgment 3, tooling 6).
  **Reason:** specificity. The generic procedure is row 11, and the humi branch and stage names go to per-repository config (audit A4).

**Conflicts, resolved one line each:**
- **Reported environment vs. local baseline (divergent 3 vs. the uncommitted diff).** Do a read-only reproduction in the reported environment first when access exists (the user asked "test Dev environment to reproduce", bd48c9c0 05:57). Use a local build for After proof ("test on local for after screen shot", 07:44). Missing remote access never blocks.
- **Tune the description (judgment, tooling) vs. standalone phase skills (divergent 7).** Do both. Row 8 is cheap but cannot fire while the listing hides descriptions, so the real fix is audit A3.
- **CI gate: post-merge pipeline (judgment) vs. local receipt (divergent).** When the forge has no required checks, the merge gate is local verification on the exact head being merged, including the cherry-pick head. The green post-merge pipeline is the deploy signal, not the gate.
- **AGENTS.md "don't restart approval gates" vs. exact-content approval for comments.** A pre-authorized chain covers mechanical forge actions. New agent-written prose (user-facing copy, QA/BA comments) was never part of the approved content, so it is a new action, not a restarted gate.
- **Org-specific ids and URLs vs. shared skills.** They go to per-repository config or project memory, never into shared skill prose.

## Backlog

1. **Repo-vs-installed drift check.**
   - Pattern: skill edits land in `~/.agents/skills`, a side branch or the repo, but never all three.
   - Hit: verified. The installed `work-item-delivery` has the triggers and lacks rule 6. The installed `work-item-verify` still calls the removed `run-proof.mjs`. `proof-of-work` standalone mode and the `azure-pr-write` lines are installed-only. There are 6 worktrees.
   - Mechanism: add an installed-vs-repo diff with line endings stripped to `scripts/validate_skills.py`, or a session-start warning. Add `.gitattributes`; none exists.
2. **Make Before optional in publication proof.**
   - Pattern: code enforces something the user rejected.
   - Hit: verified. `lib/publication-proof.mjs:34-40` always renders Before, and `:106-110` requires a before observation and capture for every UI case. `templates/PR.md:21-23` also has Before.
   - Mechanism: default to After-only, add a per-case `include_before` flag, and add a regression in `test/publication-proof.test.mjs`.
3. **Browser tool enum.**
   - Pattern: the runtime only accepts a tool the user does not use.
   - Hit: verified. `lib/evidence.mjs:41,91,93,167` accept only `tool: "playwright"`, while the global CLAUDE.md prefers agent-browser and chrome-devtools.
   - Mechanism: accept a `chrome-devtools` or `agent-browser` capture receipt, or document in `config.json:browser_evidence` which tool the receipts need.
4. **Per-repository release and CI config.**
   - Pattern: the order and gate rules live only in humi memory.
   - Hit: `config.json` has only `default_target_ref`.
   - Mechanism: add `release` fields (env branches, promotion branch suffix, deploy stage name), `ci_gate` (`forge-required` or `local-verify-on-head`), `pr.optional_reviewers` and `attribution: none`, enforced in `stage-publication` and `check-action`.
5. **Windows-clean tests.**
   - Pattern: test paths are not portable.
   - Hit: verified. 13 test files use `new URL(...).pathname`, and 5 test files call `symlink`. CI runs `ubuntu-latest`, so the repo's CI enforcement holds, but local Windows verification breaks.
   - Mechanism: use `fileURLToPath` (already in `lib/workflow-context.mjs:3,8`), skip symlink tests when EPERM, and run with `--test-concurrency=2`.
6. **Memory preflight before fan-out.**
   - Pattern: OOM from parallel dev server, test suite and agents (Jest exit 134, "memory allocation failed").
   - Mechanism: a free-memory check in the runtime before `verify`, `swarm` and parallel writers, with worker caps carried in the approved argv.
7. **MCP startup check.**
   - Pattern: servers launched through `npx` exceed the 30 s connect limit.
   - Mechanism: ship the startup check as a doctor command in setup, and stop recommending `npx` or `azcli` in `references/claude-code.md:28,38`.
8. **`package.json` `scripts.check`.**
   - Pattern: a hand-listed file set that drifts.
   - Mechanism: replace it with a glob loop.

## Workflow audit

| Sev | Finding | Evidence file:line | Fix | Raised by |
|---|---|---|---|---|
| P1 (A1) | The skills disagree across three places: the repo branch (dirty), the unmerged `1b87929` branch and the installed copies. | `git branch -a --contains 1b87929` returns only `feat/reflect-pr-proof-after-only` and it is not in HEAD (verified). `~/.claude/skills` junctions to `~/.agents/skills`, which is a real copy (verified). Diffs: `work-item-delivery/SKILL.md:3,13`, `proof-of-work/SKILL.md:7-15`, `work-item-verify/SKILL.md:13`, `azure-pr-write/SKILL.md:3,28,32` | Cherry-pick `1b87929` into `feature/workflow-swarm`, reinstall, then Backlog 1. | J, T, D |
| P1 (A2) | The runtime requires Before images, contradicting the After-only rule the user accepted. | `vendor/work-item-runtime/lib/publication-proof.mjs:34-40,106-110`; `templates/PR.md:21-23` (verified) | Backlog 2. | J |
| P1 (A3) | The workflow never runs: 0 `work-item-*` Skill calls in 24 sessions (verified). Phase skills appear as bare names with no description in the skill listing, including this session's (verified; cause not confirmed). Phase skills refuse to run outside the chain. No real Work Item has been through the runtime (`docs/human-journey.md:39`). | `skills/work-item-*/SKILL.md:8` ("Run inside the chain"); `skills/clarify/SKILL.md:3` collides on "break down" | Hide phase skills from model listing (`disable-model-invocation`) so the entry skill keeps its description. Add a CLAUDE.md pointer "WI <id> → /work-item-delivery". Give phase skills a standalone mode. Run one real Work Item end to end before more rule edits. | J, T, D |
| P1 (A4) | Nothing owns promotion (develop merge, SIT cherry-pick, deploy-green signal, Work Item state, QA note), and rule 6 makes SIT a handoff by default. | `skills/work-item-delivery/SKILL.md:13`; `skills/work-item-publish/SKILL.md:16` ("not merging or deploying"); `config.json` (only `default_target_ref`) | Row 11 plus Backlog 4. | J, T, D |
| P2 (A5) | The capture tool is fixed to Playwright, against the user's global browser rule, and the writer's check uses Claude in Chrome. | `lib/evidence.mjs:41,93`; `config.json` `browser_evidence.tool`; `docs/business-evidence.md` (Playwright paragraph); `references/claude-code.md:35-41`; `work-item-implement/SKILL.md:16` | Backlog 3, then update the docs to chrome-devtools / agent-browser. | J, T, D |
| P2 (A6) | The CI gate is either vacuous or blocking on repositories with no PR build. | `skills/work-item-approved-action/SKILL.md:11` ("no CI run is not a CI pass") | When no required checks exist, require local verify on the exact merge or cherry-pick head (conflict resolved above), driven by `ci_gate` config. | J, T, D |
| P2 (A7) | A pre-authorized chain let agent-written Thai copy and a QA comment ship unseen. | `AGENTS.md` rule table; `work-item-approved-action/SKILL.md:8`, compared with `work-item-publish/SKILL.md:16`. Nothing in `skills/work-item-*` mentions user-facing copy. | Pre-authorization covers mechanical actions. New prose or copy outside the approved diff is shown first. In implement step 5 (Green), don't touch copy the ticket did not report. | J, D |
| P2 (A8) | The Azure DevOps setup doc recommends the setup that failed here: `npx` plus `azcli`, with an `az` fallback when `az` is not installed. | `references/claude-code.md:28,31` (verified) | Recommend a global install with PAT auth, a REST-with-PAT read fallback, and the user-only reconnect for project MCP servers. Keep org paths in memory. | J, T |
| P2 (A9) | The reproduction default sends investigation to local and treats the reported environment as provenance, though WI 76368's root cause appeared only on Dev with real data. | Uncommitted diff: `docs/business-evidence.md` "Developer verification scope"; `work-item-investigate/SKILL.md:13-14`; `work-item-delivery/SKILL.md:13` | Before committing: read-only reproduction in the reported environment first when access exists; local for After; missing access never blocks (conflict resolved above). | D (conflicts with the uncommitted change) |
| P2 (A10) | There is no proportionate lane: one-component bug fixes pay for arena, interrogate with every seat, a challenger and two reviewers, and a missing seat (Grok unavailable) holds design. | `work-item-design/SKILL.md:13`; `work-item-investigate/SKILL.md:15`; `work-item-review/SKILL.md:11` | A small-bug lane keyed on risk: keep plan approval, Red tests and proof; skip arena, interrogate, the challenger and the second reviewer; allow seat substitution with a label. | J, D |
| P2 (A11) | Parallel fan-out has no memory gate on a host that hit OOM 3 times. | `work-item-implement/SKILL.md:19`; `work-item-verify/SKILL.md:12,14` | Backlog 6. | J, T |
| P2 (A12) | No out-of-scope or deferred bucket exists: the user makes scope calls by hand, and deferred reviewer promises resurface only through handoffs. | `work-item-review/SKILL.md:15`; `work-item-report/SKILL.md:11-12` | Out-of-scope findings go to a recorded follow-up with an owner. A merge with deferrals records them as open items. A defect caused elsewhere gets a linked new ticket. | J, D |
| P2 (A15) | Runtime tests fail on native Windows, where the user works. | 13 test files use `new URL(...).pathname` (verified). 5 test files use `symlink` (verified). `.github/workflows/validate.yml:13` is `ubuntu-latest`. The 93/260 failure count is tooling's figure, not rerun. | Backlog 5, or state clearly that the chain runs only in WSL (`references/setup.md:3`). | T, D |
| P3 (A13) | `clarify` (untracked) requires exclusions and always offers to deliver, against the d47e4a17 correction. | `skills/clarify/SKILL.md:43-45,131` | List only sibling-owned or ticket-hinted exclusions. If nothing is left to decide, send nothing. Drop "break down" from the description. | J, D |
| P3 (A14) | The writer guard keys on the run, not the session, so forks may pass. | `skills/work-item-delivery/scripts/run-conflicts.mjs:1-5,24-27` | Add a per-session owner token. Not verified as the cause of the f549def9 fork edit, because no run existed. | D |
| P3 (A16) | Housekeeping. | `package.json` `scripts.check` manual list; no `.gitattributes`; `provenance.json` and `coverage.json` modified in the dirty tree | Backlog 8. Add `.gitattributes`. Run `scripts/check-work-item-package.py` before commit (not run here). CRLF-vs-LF drift is reported by tooling, not verified. | T |

Reviewers: J = judgment, T = tooling, D = divergent.

**Not verified:** the cause of descriptions missing from the listing, the 93/260 Windows test failure count, CRLF drift, the PAT curl attachment upload, and the fork/run-conflicts mechanism. No Azure DevOps queries were made and nothing was posted.