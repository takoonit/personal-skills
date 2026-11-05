# Windows and WSL

Run the installer and wizard inside the Linux distribution used by the agent. Open its WSL terminal and use the same Bash commands as Linux. Native Windows agents can read the installed skill/runtime using the distribution's UNC path; use `wslpath -w` inside that distribution to find it.

For a native Windows host, choose that Windows application's actual skill directory in stage 1; installing only into the Linux home does not register skills in the Windows application. In PowerShell, `wsl.exe -d YOUR_DISTRO -- wslpath -u "$env:USERPROFILE\.codex\skills"` prints the Linux path to the Windows Codex skill root. Use `.claude\skills` or `.cursor\skills` for those hosts. Paste the printed path into the wizard, preserving any spaces. The runtime remains executed by Linux Node through WSL. This bridge is documented but has not been tested end to end in a fresh native Windows host.

Use `wsl.exe -d YOUR_DISTRO -- bash -lc 'node /absolute/installed/skills/work-item-delivery/vendor/work-item-runtime/bin/wid.mjs help'` when invoking from PowerShell. Replace YOUR_DISTRO and the installed path with inspected values. CLI file/repository/run arguments use Linux paths; quote each argument. This package does not install a Windows launcher or assume a distribution name.

## Native vault skills

The business-context stage uses claude-obsidian's `wiki-query` and `think`, whose vault scripts need WSL. For Windows hosts the installer also copies native replacements from `windows/skills/`:

- `wiki-query`: read-only vault search with the host's own Read/Grep/Glob tools. It has no retrieval index or claim ledger, so evidence status comes from note frontmatter, and its output maps to `knowledge.second_brain`.
- `think`: the same ten-stage reasoning loop, which needs no runtime.

They install automatically when the installer runs under native Windows Python or targets a skill directory under `/mnt/<drive>/` from WSL. Override with `--windows-host yes` or `--windows-host no`. Linux and macOS installs never receive them. If claude-obsidian's skills are already installed in that skill directory, the installer refuses the conflict and leaves them in place; installing both through a plugin and a copied skill may duplicate the names.

Connector credentials and plugin/hook trust belong to the current host. Installing these skills does not authenticate Azure DevOps, grant remote-write permission or approve a Work Item plan.
