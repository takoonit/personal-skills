# Personal Skills

Version-controlled source for personal ChatGPT and Codex skills.

## Layout

```text
skills/
  <skill-name>/
    SKILL.md
    agents/openai.yaml       # optional UI metadata
    references/              # optional supporting knowledge
    scripts/                 # optional deterministic utilities
    assets/                  # optional reusable files
```

Each directory under `skills/` is a portable skill package. Its directory name must match the `name` field in `SKILL.md`.

## Included skills

| Skill | Purpose |
| --- | --- |
| [`shape-system-work`](skills/shape-system-work/SKILL.md) | Decide system direction before coding and hand off a delivery brief. |
| [`clear-tactful-writing`](skills/clear-tactful-writing/SKILL.md) | Draft direct, fact-grounded Thai and English messages with appropriate tact. |
| [`ship-sound-code`](skills/ship-sound-code/SKILL.md) | Implement defined code changes with YAGNI, DX, UX, and verification gates. |
| [`dextor`](skills/dextor/SKILL.md) | Identify evidence-backed code bloat and ask before safe removal. |
| [`doakes`](skills/doakes/SKILL.md) | Challenge vague intent and drift from the project’s core concept. |
| [`lundy`](skills/lundy/SKILL.md) | Independently validate consequential completed work using focused subagents. |
| [`intentional-design`](skills/intentional-design/SKILL.md) | Design purposeful, expressive product UI around real user outcomes. |

## Add or update a skill

1. Add or replace its complete directory under `skills/<skill-name>/`.
2. Keep machine-specific paths, credentials, private customer data, and generated output out of the skill.
3. Run `python scripts/validate_skills.py`.
4. Review the diff before committing.

The validation workflow runs automatically for pushes and pull requests.

## Security boundary

This repository is public. Store reusable instructions and non-sensitive examples only. Put secrets in environment variables or a secret manager, never in a skill.

