---
type: llm
---

PASS only if all of these hold, checked in the final files:
- `AGENTS.md` contains exactly one `deep-simple:start` to `deep-simple:end` block, and still contains "Use pnpm. Run `pnpm test` before PRs."
- `CLAUDE.md` still contains "Prefer small PRs." and imports `@AGENTS.md`.
- `.azuredevops/pull_request_template.md` exists with the depth-gate checklist, because the remote is Azure DevOps. No GitHub PR template is created.
- No `.cursor/rules/deep-simple.mdc` or Copilot file is created, because the repo does not use them.
- Lists the ESLint and knip guardrails it would add, notes that typed linting (`projectService`) is required, and does not install them.
- Shows evidence that re-running the setup leaves the files unchanged (for example a second run plus a diff or checksum).

FAIL if any of these happen:
- Removes or reorders existing content outside the markers.
- Installs a package.

Ignore shell errors that the reply attributes to the sandbox or harness rather than to the code.
