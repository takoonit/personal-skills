# Personal Skills

A version-controlled collection of reusable skills for Claude Code, ChatGPT and Codex. Each skill gives an agent a focused job, clear ownership boundaries, decision rules, and hand-offs to neighbouring skills instead of one giant catch-all prompt.

## How the skills fit together

The collection is designed as a small operating system for recurring work:

- **Gate** whether work deserves attention before spending effort.
- **Shape** ambiguous product or system work into a decision-ready direction.
- **Challenge** weak assumptions, product drift, and unnecessary complexity.
- **Design** with consistent visual rules across planning, implementation and review; shape purposeful interactions and diagnose behavioural UX friction.
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

## Install

**Claude Code.** The core skills ship as the `boat` plugin, so every skill is namespaced as `/boat:<skill>`:

```text
/plugin marketplace add takoonit/personal-skills
/plugin install boat@boat-skills
```

On Claude Code 2.1.275 or later, `/plugin install boat --marketplace takoonit/personal-skills` does both in one step. The plugin carries the core groups below. The Work Item and Azure DevOps skills are installed by their [setup wizard](#work-item-delivery-workflow) instead, because they need a runtime, a CLI and session hooks that the plugin does not install.

**ChatGPT and Codex.** Copy the skill directories you want. `agents/openai.yaml` supplies each skill's display name and invocation policy, and skills call each other as `$<skill>`.

## Naming

Names follow two rules, so a name tells you what kind of skill it is before you open it:

- **Characters question work.** The crew are named after people whose job is suspicion: Doakes, Dextor and Lundy from *Dexter*, and the Shark Tank panel. They challenge, investigate or validate. They never build.
- **Plain names do work.** Every other name states its outcome (`ship-sound-code`, `clear-tactful-writing`). Skills that belong to one workflow share a prefix: `work-item-<phase>`, `azure-<artifact>`.

In Claude Code the plugin adds the `boat:` prefix. Inside skill files, cross-references stay as `$<skill>` so they work on every host.

## Included skills

### The crew

| Skill | Role | Use it when... |
| --- | --- | --- |
| [`shark-tank`](skills/shark-tank/SKILL.md) | Business challenger | An early product or business idea needs evidence, sharper questions, commercial pressure-testing, and a realistic invest / test / pass judgement. |
| [`doakes`](skills/doakes/SKILL.md) | Intent challenger | A request may be drifting from the project's core outcome or adding complexity without a strong reason. |
| [`dextor`](skills/dextor/SKILL.md) | Code-bloat investigator | Existing code may contain evidence-backed duplication, dead weight, or unnecessary complexity that should be investigated before removal. |
| [`lundy`](skills/lundy/SKILL.md) | Independent validator | Consequential completed work needs an independent acceptance pass using focused validation agents. |

### Direction

| Skill | Role | Use it when... |
| --- | --- | --- |
| [`strategic-gate`](skills/strategic-gate/SKILL.md) | Attention gate | A proposed task, feature, or initiative needs a quick decision on whether it deserves effort now. |
| [`shape-system-work`](skills/shape-system-work/SKILL.md) | System shaper | Product or architecture direction is still ambiguous and needs trade-offs resolved before implementation. |

### Design

| Skill | Role | Use it when... |
| --- | --- | --- |
| [`design-guide`](skills/design-guide/SKILL.md) | Visual direction and ongoing design guidance | Any task affects visual design or UX, including routine implementation, fixes, assets, reviews and visual work in other media. Reuse existing rules; establish a full system only when needed. |
| [`intentional-design`](skills/intentional-design/SKILL.md) | Interaction designer | A product flow needs purposeful hierarchy, state, feedback, restrained delight, or behaviour-aware interaction design. |
| [`laws-of-ux`](skills/laws-of-ux/SKILL.md) | Behavioural UX diagnostician & auditor | Use Diagnostic mode when behaviour could materially change a design decision. Use Audit mode to inspect a rendered UI or journey, surface 3–5 evidence-backed candidate laws, and reduce them to the 1–3 highest-value UX changes. The skill may also conclude that no law applies or evidence is insufficient. |

### Build and communicate

| Skill | Role | Use it when... |
| --- | --- | --- |
| [`ship-sound-code`](skills/ship-sound-code/SKILL.md) | Implementation and engineering standards | A defined change needs proportionate implementation and verification, or a repository needs coding standards, concise guardrails and executable quality gates. Audit requests stay read-only unless fixes are authorised. |
| [`clear-tactful-writing`](skills/clear-tactful-writing/SKILL.md) | Communication | Facts, decisions, requests, or difficult messages need concise Thai or English wording with appropriate tact. |

### Work Item delivery (installed by the setup wizard)

| Skill | Use it when... |
| --- | --- |
| [`work-item-delivery`](skills/work-item-delivery/SKILL.md) | Start, plan, deliver or resume an Azure DevOps Work Item. Routes to the phase skills below. |
| [`work-item-investigate`](skills/work-item-investigate/SKILL.md) | Intake and independent investigation into a reconciled dossier. |
| [`work-item-design`](skills/work-item-design/SKILL.md) | Architect, arena and interrogate the dossier into an approved plan with locked Red tests. |
| [`work-item-implement`](skills/work-item-implement/SKILL.md) | Turn one approved unit's Red tests green with a root-cause fix. |
| [`work-item-verify`](skills/work-item-verify/SKILL.md) | Run the approved checks and capture human-reproducible evidence. |
| [`work-item-review`](skills/work-item-review/SKILL.md) | Review the exact head with reviewers who did not write the code. |
| [`work-item-publish`](skills/work-item-publish/SKILL.md) | Stage the exact PR payload for approval. |
| [`work-item-approved-action`](skills/work-item-approved-action/SKILL.md) | Run an action the user already approved, such as publishing or merging. |
| [`work-item-report`](skills/work-item-report/SKILL.md) | Report coverage, evidence, holds and handoff after a run. |
| [`work-item-align`](skills/work-item-align/SKILL.md) | Reconcile a user correction or stop on a missing decision, at any phase. |
| [`work-item-start-safety`](skills/work-item-start-safety/SKILL.md) | Check readiness, realistic estimates and the writer and workspace guards. |
| [`proof-of-work`](skills/proof-of-work/SKILL.md) | Plan human-reproducible verification and gather PR evidence. |

### Azure DevOps documentation (installed by the setup wizard)

| Skill | Use it when... |
| --- | --- |
| [`azure-pr-format`](skills/azure-pr-format/SKILL.md) | Apply the three-section team PR format and its anti-pattern checks. |
| [`azure-pr-write`](skills/azure-pr-write/SKILL.md) | Write or revise a PR in that format. |
| [`azure-pr-review`](skills/azure-pr-review/SKILL.md) | Review a PR description for format, clarity and honest evidence. |
| [`azure-commit-message`](skills/azure-commit-message/SKILL.md) | Draft a commit message grounded in the diff. |
| [`azure-change-record`](skills/azure-change-record/SKILL.md) | Write a full change record with diagrams, test plan and release notes. |

## Work Item delivery workflow

The collection also includes [`work-item-delivery`](skills/work-item-delivery/SKILL.md), [`work-item-start-safety`](skills/work-item-start-safety/SKILL.md), and [`proof-of-work`](skills/proof-of-work/SKILL.md), with their owned Azure PR/commit skills and a self-contained local runtime. The workflow runs as nine chained phase skills, `work-item-investigate` through `work-item-report`, each owning one phase's procedure; the [`work-item-delivery`](skills/work-item-delivery/SKILL.md) router chains them, and you can start or rerun one phase on its own. The workflow covers source-led intake, realistic estimates, plan approval, architect/arena/interrogate design, approved execution, tests, human-repeatable evidence and exact PR review/publication boundaries.

Start with [Start a Work Item](skills/work-item-delivery/references/start-a-work-item.md) for the starting prompt, plan and estimate review, implementation approval, human-reproducible evidence, and PR publication steps.

Read the [setup guide](skills/work-item-delivery/references/setup.md) and [prerequisites](skills/work-item-delivery/references/prerequisites.md), then run the five-stage wizard in Linux or WSL:

```sh
bash scripts/setup-work-item-delivery.sh
```

On Windows hosts the installer also adds native `wiki-query` and `think` skills from [`windows/skills/`](windows/skills/) in place of claude-obsidian's WSL-bound versions; other platforms never receive them. See [Windows and WSL](skills/work-item-delivery/references/windows.md).

For Claude Code hosts the installer also adds four subagent definitions from [`claude/agents/`](claude/agents/) when given `--agents-dir`, and the package ships a SessionStart hook that re-injects the active run after compaction. See [Claude Code](skills/work-item-delivery/references/claude-code.md). `node scripts/eval_work_item_chain.mjs` runs a live, token-spending smoke eval of the plan-approval gate through `claude -p`; it is not part of CI.

The installer preserves existing conflicting installs and keeps organization settings local. External pstack/Matt Pocock plugins, native hook trust, available models, connectors and browser access are configured in the agent host; cached files and offline tests do not certify live integration. The bundled runtime is a sanitized source snapshot with provenance and retained third-party notices. No private run evidence or credentials are included.

## Using Design Guide

[Design Guide](skills/design-guide/SKILL.md) contributes design guidance throughout work with visual or UX impact. It works alongside Intentional Design for interaction decisions, Laws of UX for behavioural diagnosis, and Ship Sound Code or Impeccable for implementation. Companion skills are optional; each keeps ownership of its specialised work.

- **Ongoing work:** reuse the current visual authority, tokens and components; review only affected rules and states. A small fix does not require an interview, a new style or new documentation.
- **New or revised web/app system:** inspect the brief/repository, ask only material questions, select one primary style and resolve all six techniques. Write `DESIGN.md` and concise `DESIGN-GUARDRAILS.md`, preserving an incumbent filename such as `Design.md`, and add one project instruction pointer.
- **Advice or audit:** answer or report evidence without changing files unless changes are requested. For documents, presentations and assets, follow that medium's conventions rather than forcing a web design system.

The [seven detailed guides](skills/design-guide/references/styles.md) cover neoskeuomorphism, kinetic typography, intentional minimalism, editorial design, story-driven animation, human-made design and expressive design. Each includes typography, a meaningful focal element, visual rhyming, subtle depth, text emphasis and design variations, with responsive, interaction and review guidance. Existing absent treatments are recorded honestly rather than silently added.

Example requests:

- “Fix this mobile layout while preserving the current design.”
- “Use editorial design for this site and write its design rules.”
- “Audit this page against its design guardrails; do not change it.”

Implicit invocation is enabled in the package for supporting hosts. Explicit invocation uses `$design-guide`. Invocation and enforcement still depend on the host and project workflow; Markdown alone does not install CI checks or guarantee every agent follows it.

## Evals

`evals/` holds behavioural test cases for every skill in the `boat` plugin, run with [`claude plugin eval`](https://code.claude.com/docs/en/plugin-evals). Each case is a realistic request plus graders. It runs once with the skills loaded and once with no skills, so the report shows what the skills add (`Δ`), not only whether the answer was good.

```text
evals/<skill>/<case>/
  prompt.md          # frontmatter: the plugin's skills, tags, tools; body: the request
  graders/*.md       # skill-fired, file and tool checks, and an LLM rubric
  case.yaml          # only when the case needs fixture files
  setup.sh, fixture/ # copied into the empty workspace before the run
```

Run from the repository root. Cases list the eleven plugin skill folders under `plugins:`, because `claude plugin eval` loads plugins per case and this repository root is not itself a plugin. `validate_skills.py` fails when a case's list drifts from `.claude-plugin/marketplace.json` or a plugin skill has no case.

```sh
# Everything: 52 cases, 3 runs per arm
claude plugin eval . --scaffold --trust-plugin --allow-tools Write Edit Bash --judge-model sonnet --max-cost-usd 40

# One skill
claude plugin eval . --tag lundy --scaffold --trust-plugin --allow-tools Write Edit Bash

# One case, one run, plugin arm only: cheapest while editing a skill
claude plugin eval . --case stacked-coupon-gap --runs 1 --ablation none --scaffold --trust-plugin --allow-tools Write Edit Bash
```

- **Requirements.** Claude Code 2.1.269 or later and git 2.31 or later. Cases that grant `Bash` run in Claude Code's sandbox, which needs `bubblewrap` and `socat` on Linux or WSL.
- **Cost.** Every run and judge call is billed to your account. In smoke runs a prompt-only run cost about $0.04 to $0.08 and a fixture run about $0.06 to $0.26, so a full suite lands roughly in the $25 to $35 range. Keep `--max-cost-usd` on.
- **Judge.** The default judge is a small model and can misread long replies. Use `--judge-model sonnet` before trusting a regression.
- **Results** go to `evals/results/`, which git ignores.

To add a case, copy a sibling case folder, change the request and graders, and keep the `plugins:` list as it is. Give each case one grader on the result and one on the steps, such as `skill-fired`.

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

1. Add or replace its complete directory under `skills/<skill-name>/`. Name it by the [naming rules](#naming).
2. Keep the skill's ownership narrow and state both positive and negative trigger conditions.
3. Put deep supporting material in `references/` rather than bloating the operational `SKILL.md`.
4. Keep machine-specific paths, credentials, private customer data, and generated output out of the skill.
5. Add [eval cases](#evals) under `evals/<skill>/`. A plugin skill needs at least one, and more when routing, abstention or judgement quality matters.
6. List it in its group under [Included skills](#included-skills). For a core skill, also add its path to the `boat` plugin's `skills` list in `.claude-plugin/marketplace.json`.
7. Run `python scripts/validate_skills.py`, and `claude plugin validate .` when the plugin changed.
8. Review the diff before committing.

The validation workflow runs automatically for pushes and pull requests. It fails when a skill is missing from this README, when the plugin lists a skill that does not exist or that the setup wizard installs, or when the eval cases drift from the plugin.

## Security boundary

This repository is public. Store reusable instructions and non-sensitive examples only. Put secrets in environment variables or a secret manager, never in a skill.
