# Personal Skills

A version-controlled collection of reusable skills for ChatGPT and Codex. Each skill gives an agent a focused job, clear ownership boundaries, decision rules, and hand-offs to neighbouring skills instead of one giant catch-all prompt.

## How the skills fit together

The collection is designed as a small operating system for recurring work:

- **Gate** whether work deserves attention before spending effort.
- **Shape** ambiguous product or system work into a decision-ready direction.
- **Challenge** weak assumptions, product drift, and unnecessary complexity.
- **Design** purposeful interactions and diagnose behavioural UX friction.
- **Implement** accepted changes with proportionate engineering discipline.
- **Validate** consequential completed work independently.
- **Communicate** findings and decisions clearly.

Skills may invoke or hand off to one another when ownership changes. A specialised skill should stay narrow rather than absorbing adjacent responsibilities.

## Layout

```text
skills/
  <skill-name>/
    SKILL.md
    agents/openai.yaml       # optional invocation and UI metadata
    references/              # optional supporting knowledge and evidence
    scripts/                 # optional deterministic utilities
    assets/                  # optional reusable files
```

Each directory under `skills/` is a portable skill package. Its directory name must match the `name` field in `SKILL.md`.

## Included skills

| Skill | Role | Use it when... |
| --- | --- | --- |
| [`strategic-gate`](skills/strategic-gate/SKILL.md) | Attention gate | A proposed task, feature, or initiative needs a quick decision on whether it deserves effort now. |
| [`shark-tank`](skills/shark-tank/SKILL.md) | Business challenger | An early product or business idea needs evidence, sharper questions, commercial pressure-testing, and a realistic invest / test / pass judgement. |
| [`shape-system-work`](skills/shape-system-work/SKILL.md) | System shaper | Product or architecture direction is still ambiguous and needs trade-offs resolved before implementation. |
| [`doakes`](skills/doakes/SKILL.md) | Intent challenger | A request may be drifting from the project's core outcome or adding complexity without a strong reason. |
| [`intentional-design`](skills/intentional-design/SKILL.md) | Interaction designer | A product flow needs purposeful hierarchy, state, feedback, restrained delight, or behaviour-aware interaction design. |
| [`laws-of-ux`](skills/laws-of-ux/SKILL.md) | Behavioural UX diagnostician | A design decision depends on how people find, understand, decide, act, remember, learn, wait, recover, or finish. It diagnoses evidence first, treats UX laws as hypotheses, and may conclude that no law is needed. |
| [`ship-sound-code`](skills/ship-sound-code/SKILL.md) | Implementation discipline | The intended behaviour is defined and the change now needs clean, proportionate implementation and verification. |
| [`dextor`](skills/dextor/SKILL.md) | Code-bloat investigator | Existing code may contain evidence-backed duplication, dead weight, or unnecessary complexity that should be investigated before removal. |
| [`lundy`](skills/lundy/SKILL.md) | Independent validator | Consequential completed work needs an independent acceptance pass using focused validation agents. |
| [`clear-tactful-writing`](skills/clear-tactful-writing/SKILL.md) | Communication | Facts, decisions, requests, or difficult messages need concise Thai or English wording with appropriate tact. |

## Design principles

### Narrow ownership

A skill should trigger because its specialised reasoning can materially change the decision, not merely because the prompt contains a related keyword. Explicit negative triggers and hand-offs reduce accidental overlap.

### Evidence before ceremony

Skills should distinguish observation from inference, challenge unsupported assumptions, and prefer the smallest useful intervention. Named frameworks, personas, laws, or patterns are tools for reasoning, not decorations.

### Proportionate reasoning

Do not force every workflow through every checkpoint. Straightforward work should stay straightforward; consequential or ambiguous work earns deeper scrutiny.

### Explicit stopping conditions

A good skill can abstain, reject a weak premise, ask for missing evidence, or hand ownership to another skill. More output is not automatically better output.

## Add or update a skill

1. Add or replace its complete directory under `skills/<skill-name>/`.
2. Keep the skill's ownership narrow and state both positive and negative trigger conditions.
3. Put deep supporting material in `references/` rather than bloating the operational `SKILL.md`.
4. Keep machine-specific paths, credentials, private customer data, and generated output out of the skill.
5. Add representative eval cases when routing, abstention, or judgement quality matters.
6. Run `python scripts/validate_skills.py`.
7. Review the diff before committing.

The validation workflow runs automatically for pushes and pull requests.

## Security boundary

This repository is public. Store reusable instructions and non-sensitive examples only. Put secrets in environment variables or a secret manager, never in a skill.
