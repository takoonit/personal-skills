# Contributing

Preserve each skill's useful expertise while reducing unnecessary instructions. Keep shared personal guidance separate from project-specific rules.

## Edit a skill

Define the task it owns, a concrete trigger, the result it produces, and the behavior that must remain intact. Organize the entrypoint around that contract; do not require identical headings across skills.

Keep essential decision rules and pitfalls in `SKILL.md`. Put conditional examples and detailed guidance in references linked directly from the entrypoint. Explain when to read each reference. Add scripts only for repeated deterministic work.

Update invocation metadata, the README, and relevant behavior scenarios with the skill. The Dexter group must retain distinct intent, cleanup, and validation responsibilities. A rename also needs an installation migration note.

## Run local checks

Use Python 3.12 or later in an isolated environment:

```sh
python -m venv .venv
```

Activate it with `.venv\Scripts\Activate.ps1` in PowerShell or `source .venv/bin/activate` in a POSIX shell, then run:

```sh
python -m pip install -r requirements-dev.txt
python scripts/validate_skills.py
python -m unittest discover -s tests -v
git diff --check
```

PyYAML was already required by the original tests; its version is now declared for reproducible checks. CI runs the validator and tests. The validator checks metadata and local Markdown links; it does not fetch external URLs or execute models.

Tests should exercise package contracts and invalid inputs, not freeze headings or exact prose. Allow optional metadata to remain optional.

## Evaluate behavior

Use [the evaluation standard](docs/evaluation.md). The JSON scenarios and existing UX YAML cases are specifications to execute and grade, not passing benchmark results. Do not claim improved routing, runtime token cost, or model reliability from a static check.

Review the diff before a commit. Keep generated environments and benchmark artifacts out of version control. Store only non-sensitive fixtures and instructions in this public repository.
