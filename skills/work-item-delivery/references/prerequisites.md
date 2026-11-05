# Prerequisites

The included skills are `work-item-delivery`, `work-item-start-safety`, `proof-of-work`, `azure-pr-format`, `azure-pr-write`, `azure-pr-review`, `azure-commit-message` and `azure-change-record`. The setup installer installs these together; the two thin entry skills depend on the canonical implementations inside the delivery package's vendored runtime.

| Requirement | Source and setup | Verification boundary |
| --- | --- | --- |
| Git, Node 22+ and Python 3 | Install through your platform's normal package manager; use a current supported Node 22 or 24 release. No npm packages are required by the runtime. | Installed launcher and actual offline tests must run. Node needs `node:sqlite`; an old Node 22 minor may lack it. |
| Bash on Linux/WSL | Run the setup script from that environment. | Native Windows execution is not tested; Windows agents invoke the Linux runtime through WSL. |
| pstack | [Upstream installation](https://github.com/michael-denyer/pstack-claude#codex), [runtime reference](https://github.com/michael-denyer/pstack-claude/blob/main/docs/reference.md). Inspected local version: **0.9.101**. Install the complete plugin so relative principle/agent references remain intact. | Confirm actual session skill loading, native delegation, available models and optional hook trust. A cached folder is not sufficient. |
| Matt Pocock skills | [Upstream installation](https://github.com/mattpocock/skills#installation-30-second-setup). Inspected local version: **1.3.1**. | `to-spec` declares `disable-model-invocation: true` and its last step publishes to the tracker, so the workflow reads it as a template and never invokes it. It is absent from the model's skill catalog by design; it only needs to exist on disk. |
| Azure DevOps read/write capability | Microsoft's official MCP server, hosted at `https://mcp.dev.azure.com/ORGANIZATION` or local `@azure-devops/mcp`, authenticated through its supported login. Claude has no first-party connector; [Claude Code](claude-code.md) gives the commands and the Azure CLI read-only fallback. | Read the actual Work Item/revision and repository metadata. Publishing needs its separate exact-content approval. No connector, token or credentials are bundled. |
| Business specifications and knowledge | Connect the sources linked by the Work Item. For Obsidian, [claude-obsidian](https://github.com/AgriciDaniel/claude-obsidian) version **3.0.1** supplied `wiki-query` and `think` in the inspected setup. | Read versioned primary requirements; record missing/inapplicable sources in the plan rather than inventing citations. |
| Browser/capture driver | A Playwright driver: a Playwright skill, the Playwright MCP server (`@playwright/mcp`) or the `playwright` library, plus the actual local app/test data. Capture receipts record `tool: "playwright"`, so another browser tool cannot produce one. | Required for affected UI cases. A login page, mock unrelated app or screenshot alone cannot certify the complete case. |
| Java or Docker, optional formal guard check | The checker downloads checksum-pinned TLA+ tools 1.7.4; its fallback container is digest-pinned. | `python3 .agents/skills/work-item-start-safety/scripts/check.py` from the installed runtime. Network is needed for an uncached tool/image download. |

The optional pstack session hook routes ordinary tasks to `poteto-mode`; the workflow itself never invokes it.

## Plugin skills

The workflow invokes or reads exactly these plugin skills. A test fails when a workflow file names a skill missing here, or when one listed here is no longer used. Keep the complete upstream packages, because these skills invoke further shared references.

| Plugin | Skills |
| --- | --- |
| pstack | `pstack:architect`, `pstack:arena`, `pstack:correct`, `pstack:deslop`, `pstack:figure-it-out`, `pstack:how`, `pstack:interrogate`, `pstack:maintain-formal-verification-skill`, `pstack:principle-fix-root-causes`, `pstack:principle-guard-the-context-window`, `pstack:reflect`, `pstack:setup-pstack`, `pstack:show-me-your-work`, `pstack:swarm`, `pstack:tdd`, `pstack:teach`, `pstack:why` |
| Matt Pocock skills | `mattpocock-skills:code-review`, `mattpocock-skills:wizard`, `mattpocock-skills:to-spec` (template only, never invoked) |
| claude-obsidian | `claude-obsidian:wiki-query`, `claude-obsidian:think`; other hosts and the Windows replacements use the short names `wiki-query` and `think` |

## Installation notes

Use the upstream commands appropriate to the host. Their current documentation lists Codex plugin commands, but an inspected local Codex CLI did not expose a `plugin` subcommand. Do not run unsupported commands or invent UI controls; use the host's supported plugin path or upgrade it, then verify a new session. Skills-only installs do not include automatic routing hooks. Installing both native and copied versions may duplicate skills.

The versions above identify inspected sources, not a guarantee that a plugin manager installs those exact versions. Upstream plugins update independently. Recheck the required capabilities after updates; the workflow's existing review gates still apply. The setup script never installs credentials, creates CI secrets, grants data access or approves product work.

Model configuration belongs to `pstack:setup-pstack` and the current host. Required design rows include `architect runners`, `arena cross-judge pool` and `interrogate reviewers`; swarm uses `swarm workers`. Choose only models actually available to the account, with effort and concurrency appropriate to the task. Independent review remains required where the workflow says so; unavailable reviewers remain a gap.

The bundled orchestration store retains its original MIT license and provenance under `vendor/work-item-runtime/vendor/pstack/`. The setup wizard preserves the Matt Pocock wizard library, with LF line endings, and its MIT notice under `licenses/`. No external plugin skill tree or private run evidence is redistributed.
