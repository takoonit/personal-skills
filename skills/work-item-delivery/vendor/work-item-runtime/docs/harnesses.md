# Harness adapters

The local runtime is shared by the configured agent hosts. Run it under Linux or WSL. The installer prints the launcher and runtime paths; derive `WORK_ITEM_DELIVERY_ROOT` from the installed package. Native Windows agents invoke the Linux runtime through WSL. Native Windows execution is not tested.

| Responsibility                          | Codex                                                                          | Claude Code                           | Cursor                                |
| --------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------- | ------------------------------------- |
| Read Work Items, relations, discussion  | Configured Azure DevOps MCP server; see discovery below | Configured Azure DevOps MCP server | Configured Azure DevOps MCP server |
| SecondBrain business context | Available `wiki-query`/`think` skills and vault read tools | Same installed skills/vault | Same installed skills/vault |
| Browser observations | Installed Playwright skill/runtime; scripts and receipts outside product source | Configured Playwright skill/runtime | Configured Playwright skill/runtime |
| Read specs                              | Available Atlassian/Drive/document tools, or supplied source files             | Configured connectors/source files    | Configured connectors/source files    |
| Local runtime and Git inspection        | `exec_command`                                                                 | Shell/Bash                            | Terminal/shell tool                   |
| Ask for missing scope or exact approval | Supported user-input tool or plain chat                                        | Supported question tool or plain chat | Supported question tool or plain chat |
| Optional delegation                     | Native collaboration tools when authorized                                     | Native Agent tool when authorized     | Native Task tool when authorized      |
| PR creation/update/read-back            | Available Azure DevOps tools                                                   | Configured Azure DevOps connector     | Configured Azure DevOps connector     |

## Context re-entry and scoped handoffs

At startup, compaction, handoff, a correction or phase/ownership change, run `work-item-delivery resume --run RUN` and read its phase card and scoped source pointers. `resume --hash HASH` rejects a stale handoff. The runtime supplies a primary action and independent eligible candidates; direct admission checks still apply. Compare component hashes when diagnosing changed context. Follow [alignment](phases/align.md) for corrections and [full delivery rules](delivery-rules.md) for detailed policy. Hashes bind recorded bytes, not consent, skill use, understanding, isolation or remote truth.

Use authorized native tools for fresh bounded role contexts, without a full-history fork by default. Brief role, cases, exact source identities, current PR.md, open correction IDs/scope, owned paths/owner, named available skills, checks, output and stop/return criteria. Preserve an admitted writer and its dirty/partial work. Declare single-agent limitations when independent contexts cannot be established. Approved-action routes use existing approvals/reviews and native execution tools without a new design/writing/reviewer panel.

## Durable native investigation

Start with investigate and request each investigation-brief independently. Dispatch only through authorized native host tools. Give initial investigators no sibling reports or preferred solution. Import each report with its issued input hash, then give the challenger the frozen completed bundle and the arbiter the exact arbitration brief. Use [the investigation contract](investigation.md) for schemas and revision rules.

Record independent-host only when the host establishes separate initial contexts. Otherwise record single-agent with its limitation. The runtime does not authenticate assignees or verify isolation. It stores evidence and enforces admission; it does not schedule agent work. On restart, cursor advises investigation tasks only when no admitted delivery controls execution.

## Azure DevOps MCP discovery

Use the configured Azure DevOps MCP server first for tracker and repository reads. Discover exposed tools and their actual schemas before calling them. When the host does not expose that server's tools, inspect its configured launcher and connect through the installed MCP SDK, retaining one client/server session across reads. On this machine the existing launcher is `/path/to/your/configured-ado-mcp-launcher`; it starts the official Azure DevOps MCP server. This is MCP access, not a REST fallback. Use a read-only tool/action allowlist during planning and preserve source responses outside product repositories.

An unrelated connector's cancelled call does not establish the configured MCP server's availability. An MCP authentication timeout leaves access unverified; keep the session and allow one bounded retry after authentication can complete. Respect explicit permission denials: do not switch transports to bypass them. If MCP remains unavailable for a technical reason, explain the failure before using an authorized, bounded authenticated read-only fallback. Record the tool/transport and actual result; missing access stays a blocker, never an empty Work Item or a completed intake.

Use Azure DevOps operations rather than GitHub or Cursor-only forge commands. If direct source access remains missing, record the affected conclusions and required source/access while progressing independent work. MCP availability does not authorize tracker changes or PR publication; retain the existing exact-content approval gates.

After `init`, Cursor's next step is whatever `work-item-delivery cursor --run RUN` prints, subject to [Approval to action](playbook.md#approval-to-action). That command only reads the ledger. It does not approve a plan, create a branch, or call Azure DevOps. `await-human` stops the turn only while the required user decision is missing; record an approval already given instead of requesting it again.

A single agent can perform the complete workflow sequentially. Subagents are not a runtime requirement and are never spawned by the CLI. Keep the session's existing model configuration unless the user specifies otherwise. The active user/repo instructions and this workflow's approval-to-action rule override upstream pstack's cloud placement, automatic landing and gate-default assumptions, including another shipping verifier after the user has accepted completed review.

The approved-action runtime returns `check-new-blockers`, then `execute-approved-action` once the live preflight is clear. Use `approve-action` only to record the user's existing decision, not to ask again. Normalize actual forge responses into `check-action`; execute the returned request natively under its expected source-head condition, then retain direct read-back with `action-completed`. Unknown or failed reads are not empty checks. Completed reviews and legacy publication approvals remain accepted; missing legacy certification is never relabelled as passed.

## Normalizing a direct Azure PR read-back

Preserve the raw full API response. Map `repository.id` to `repository_id`, `lastMergeSourceCommit.commitId` to `head`, `sourceRefName`/`targetRefName` without `refs/heads/` to their branch fields, `isDraft` to `is_draft`, `workItemRefs[].id` to string `work_item_ids`, and the actual title/description unchanged. Convert the API's active status to `status: "active"` and use its verified browser PR URL as `pr_url`.

List/download the approved remote attachments and compute each exact name, byte count and SHA-256. Put those `{name, bytes, sha256}` objects in `attachments`; do not reuse the local upload hashes as evidence of remote read-back. Supply the normalized JSON to `published` only after those direct reads. Record any differing labels, reviewer settings or other protected fields against the preflight snapshot separately; this initial runtime does not certify those optional metadata fields automatically.

## Upstream adaptation

The pinned pstack store is transformed from TypeScript to ESM without behavior changes. Its own forge-frontier discovery supports GitHub/Origin, so this system does not invoke it for Azure. Per-repository readiness, exact plan/package approvals and direct-connector read-back are implemented in the local controller. Pstack's durable units, queue pointers, gates, atomic writes and process lock are used directly.
