# Claude Code

This page maps the workflow onto Claude Code's native features. It adds no gate and removes none. The runtime, phase cards and approval rules stay authoritative.

## Start and invoke

Start with `/work-item-delivery <Work Item URL>`. Claude Code uses `/name`, where the other docs show Codex's `$name`. `/proof-of-work` and the `work-item-<phase>` skills work the same way, so `/work-item-review` reruns review alone.

After the first `intake` or `resume` for a run, register it for the product directory so a later session finds it:

```sh
node SKILL_DIR/scripts/claude-session-resume.mjs --set RUN --project PROJECT_DIR
```

`SKILL_DIR` is the installed `work-item-delivery` skill directory, `RUN` the run directory and `PROJECT_DIR` the session's primary working directory, all absolute. Use `--clear --project DIR` when the delivery is finished. The registry lives at `~/.claude/work-item-delivery/active-runs.json` and holds paths only. A `WORK_ITEM_RUN` environment variable overrides it for one session.

## Connect sources

**Azure DevOps.** Claude has no first-party Azure DevOps connector, so add Microsoft's official MCP server. Upstream recommends the hosted one:

```sh
claude mcp add --transport http azure-devops https://mcp.dev.azure.com/ORGANIZATION
```

The local server can be limited to the domains this workflow uses:

```sh
claude mcp add azure-devops -- npx -y @azure-devops/mcp ORGANIZATION -d core work work-items repositories wiki --authentication azcli
```

The server has no read-only mode. Never pre-approve its write tools, so every write reaches a permission prompt, and call only read tools during planning. If the server is unavailable for a technical reason, say why, then read through the signed-in Azure CLI (`az boards work-item show --id ID --expand all`, `az repos list`, `az repos pr show`) and record that transport. A missing or denied read stays a blocker, never an empty Work Item. PR creates and updates go through the MCP server. Use `az repos pr create` or `update` only when the user explicitly authorizes that transport, under the same exact-content approval and direct read-back.

**Confluence and Jira.** The claude.ai Atlassian connector reads Confluence pages and versions. Call `getAccessibleAtlassianResources` once for the cloud ID.

**Browser.** Capture receipts record `tool: "playwright"`, so captures need a Playwright driver. Prefer the Playwright MCP server, and save its screenshots and traces into the run directory:

```sh
claude mcp add playwright -- npx @playwright/mcp@latest --isolated
```

A Node script using the `playwright` library also works; keep it in the run directory, outside product source. The Chrome extension and other browsers are not Playwright. Use them to explore, never for a capture receipt.

**Vault skills.** On Claude the vault skills register as `claude-obsidian:wiki-query` and `claude-obsidian:think`; wherever the docs say `wiki-query` or `think`, use those. Native Windows hosts receive short-named replacements instead.

## Re-entry hook

The workflow requires `resume` after startup, resumption and compaction. A SessionStart hook does this for you. It runs `resume` for the registered run and adds the packet to Claude's context before the first prompt. It prints nothing and exits 0 when no run is registered, the run directory is missing, or `resume` fails. Add it to `~/.claude/settings.json` only after the installed `work-item-delivery` contains `scripts/claude-session-resume.mjs`; until then Node fails at every session start:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume|compact",
        "hooks": [
          {"type": "command", "command": "node \"$HOME/.claude/skills/work-item-delivery/scripts/claude-session-resume.mjs\"", "timeout": 20}
        ]
      }
    ]
  }
}
```

The injected packet is the start of the re-entry step, not the whole step. Still read the phase card, corrections and pointers it names, and use `resume --hash` for a handoff. The hook sends compact JSON. When that is still over 9,000 characters it keeps the hashes, action, routing, approval, corrections, blockers and owners, lists the omitted keys and names the full command.

These commands record no decision and are safe to pre-approve. `status`, `next` and `plan` regenerate the `status.md` projection; the others write nothing. Keep `approve-plan`, `approve-publication`, `approve-action` and every other recording command on a prompt, so each recorded decision passes your eyes:

```json
{"permissions": {"allow": [
  "Bash(work-item-delivery help)", "Bash(work-item-delivery resume *)", "Bash(work-item-delivery status *)",
  "Bash(work-item-delivery next *)", "Bash(work-item-delivery cursor *)", "Bash(work-item-delivery plan *)",
  "Bash(work-item-delivery design-context *)", "Bash(work-item-delivery investigation-brief *)"
]}}
```

## Native tools by phase

| Phase | Claude Code feature |
| --- | --- |
| Investigate | Issue each `investigation-brief`, then send all briefs in one message as parallel `Agent` calls with `subagent_type: "work-item-investigator"` and `run_in_background: true`. Each subagent starts in a fresh context with no sibling reports, which is what `independent-host` requires. After every report is imported, dispatch `work-item-challenger` on the challenge brief. The coordinator arbitrates. |
| Design | `pstack:architect`, `pstack:arena` and `pstack:interrogate` dispatch their own seats from `~/.claude/rules/pstack-models.md`. That sheet uses `inherit-parent` seats, so pass `check-design.mjs --models` the resolved snapshot described in `docs/work-item-design.md`. |
| Plan approval | Show the rendered plan in chat first. Then ask with `AskUserQuestion`, offering to approve the plan hash or to revise it. Record the user's actual answer text as the `approve-plan` evidence. The question never replaces showing the plan, and an answer the user gave earlier is recorded, not asked again. |
| Implement | For the Red lock, dispatch `work-item-test-author` with the unit's Red test paths and assertions; it commits only those tests. Then the coordinator or one delegated writer per repository turns them green in the bound checkout. Do not use `isolation: "worktree"` or `EnterWorktree` for writers. The runtime binds the primary checkout and allows a linked worktree only under the conditions in `docs/repository-conventions.md`. |
| Verify | `verify` can run for minutes. Start it with Bash `run_in_background: true` and keep working on other repositories; the session is notified when it exits. Use `Monitor` only to wait on a log line. |
| Review | When no accepted review covers the unchanged head, dispatch one `work-item-reviewer` per axis in parallel, then feed their report paths to `review`. |
| Publish and approved action | Show the staged payload and hash in chat, then ask with `AskUserQuestion`. Azure DevOps writes go through the MCP server from Connect sources, and read-back follows `docs/harnesses.md`. |

## Subagents

The coordinator session is the single orchestrator. Phase skills are procedures it runs, never agents of their own. The installer copies four throwaway worker definitions into `~/.claude/agents/` when given `--agents-dir`. All use `model: inherit`, matching `inherit-parent` in the pstack sheet. The reviewer and challenger run at `effort: xhigh` because checking needs more judgment than drafting; edit the installed copies to change that.

- `work-item-investigator` answers one investigation brief.
- `work-item-challenger` challenges the frozen bundle.
- `work-item-reviewer` reviews one exact head on one axis.
- `work-item-test-author` writes and commits a unit's locked Red tests, never production code.

The first three write only their own reports outside product repositories; the test author writes only the named test paths. None records runtime state, so the coordinator keeps the single writer for every `work-item-delivery` command. The definitions omit the `Agent` tool, so a fan-out skill a brief names, such as `pstack:how`, runs as a single pass inside the subagent.

## Limits

The hook injects durable state. It does not prove the phase card was read, a skill was invoked or a decision was made. Every agent here is a Claude model, so a second reviewer is a different model at most, never a different model family; tests and runtime checks stay the oracle. Subagent separation gives fresh contexts, not proof of independent reasoning; the runtime still records what the host declares. Hooks need the user's settings and are not installed automatically.
