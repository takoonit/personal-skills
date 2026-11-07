# Incubating skills

Skills still in development. They are **not** part of the `boat` or `work-item` plugins, are not listed in the main README, and are not checked by `scripts/validate_skills.py`. Once a skill is stable, move it to `skills/` and `evals/` and wire it into a plugin.

| Skill | What it does |
| --- | --- |
| [`deep-simple`](skills/deep-simple/SKILL.md) | Structure gate for TypeScript code and UI: deepen modules and simplify interfaces. Ten testable hard fails and a blocking `DEPTH GATE`. |
| [`deep-simple-setup`](skills/deep-simple-setup/SKILL.md) | Installs the deep-simple rule into a repo: an idempotent AGENTS.md block, CLAUDE.md import, PR checklist, and optional ESLint and knip guardrails. |

## Try them by hand

Copy the skill folders into your user skills, then start a new session:

```sh
cp -R incubating/skills/deep-simple incubating/skills/deep-simple-setup ~/.claude/skills/
```

Then, in any TypeScript repo:

- `/deep-simple review this branch`
- `/deep-simple-setup`

Remove the copies when you are done testing so they don't shadow a later released version.

## Run the evals

Run from this folder, so the cases load only these two skills:

```sh
cd incubating
claude plugin eval . --tag deep-simple --scaffold --trust-plugin --allow-tools Write Edit Bash --judge-model sonnet --max-cost-usd 5
claude plugin eval . --tag deep-simple-setup --scaffold --trust-plugin --allow-tools Write Edit Bash --judge-model sonnet --max-cost-usd 3
```

| Case | Checks |
| --- | --- |
| `deep-simple/review-planted-fails` | Finds at least 8 of 10 planted hard fails, flags none of the 7 look-alike controls, edits nothing |
| `deep-simple/write-reuses-deep-module` | Reuses the existing `listInvoices` module, no leaked DB types, no status booleans, PASS gate |
| `deep-simple/trivial-copy-change` | A one-line text change stays one line, with no padded findings |
| `deep-simple-setup/install-azure-repo` | One marker block, existing content kept, Azure PR template, no installs, idempotency shown |

Please report missed hard fails, false positives on clean code, and whether the gate fires too often.
