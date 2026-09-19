# Skill evaluation standard

A skill earns its place by improving a specific task's outcome enough to justify its instruction and execution cost.

## Mandatory checks and improvement targets

The numbers below are collection-specific starting targets, not platform guarantees. Report raw counts for small samples and inspect every regression.

| Dimension | Evidence | Acceptance |
| --- | --- | --- |
| Outcome | Result or behavior against task requirements | All critical checks pass; target at least 90% first-attempt success on ordinary cases |
| Selection | Appropriate and missed invocations | Target at least 90% precision and recall per model; explicit invocation works |
| Authority | Trace of actions and questions | No observed unauthorized action or repeated approval request where authorization is clear |
| Completion | Finished work, justified question, or accurate blocker | Correct stopping point; no invented facts or verification |
| Efficiency | Loaded instructions, run tokens, retries, duration | Lower avoidable overhead without reducing quality; a 20% reduction is a useful target |
| Structure | Package validator and editorial review | No broken internal references, contradictory rules, or misleading metadata |
| Redundancy | Instructions and execution trace | No unnecessary repeated planning, checks, or hand-offs |
| Human use | README walkthrough | Choose, install, invoke, update, and remove without undocumented steps |
| Models | Separate results for each intended model | Each passes mandatory checks; do not hide regressions in an aggregate |

Token cost per successful completion is total tokens across all attempts divided by successful completions, including failed attempts in the numerator. If none succeeds, report failure rather than a finite cost. Compare versions within the same model and configuration. Record latency separately.

Count discovery metadata, activated entrypoints, and references actually loaded separately. Word and character counts are static proxies, not measured model token use or runtime savings.

## Structure review

Each skill should make its purpose, trigger, decision rules, procedure, completion condition, and conditional resources easy to find. Combine sections where that reads better. Preserve domain expertise and non-obvious pitfalls before generic reminders.

Descriptions around 20–40 words and entrypoints around 300–700 words are drafting guides. Exceptions should be justified by task evidence. Do not delete useful constraints to hit a budget.

Keep one authoritative version of a rule within a package. A short boundary repeated across independently installed skills can be justified. Test whether moving text into a reference actually reduces loading.

## Comparison protocol

Compare no target skill, the previous skill, and the candidate. Keep user prompts, starting files, tools, other instructions, permissions, and model settings fixed. Use fresh contexts and disposable fixtures. For selection tests, expose the relevant full catalog; include "no skill needed" and adjacent-skill cases.

Record the exact model ID, reasoning setting, skill revision, case ID, artifacts, actions, loaded resources, token usage, duration, and grade. Evaluate Astra and each intended GPT-5.6 variant separately. Instruction text does not select a runtime model.

Start with three execution scenarios per skill. Expand toward 10–20 selection prompts, mixing positive cases, realistic near-misses, and ambiguous prompts. Repeat critical or inconsistent cases at least three times. Hold back fresh prompts from authoring to check generalization.

Use deterministic graders for observable actions and artifact properties. Use a fixed rubric and blind comparisons for writing or judgment quality, with human review of ambiguous cases. Require evidence for a pass. Do not grade hidden reasoning or demand exact prose unless it is an actual interface contract.

## Case files and status

- [Collection scenarios](../tests/skill_cases.json): three initial cases per skill, covering ordinary use and relevant boundaries.
- [UX cases](../tests/laws_of_ux_eval_cases.yaml): existing detailed selection, abstention, audit, and misuse cases.

The static suite validates these case files and their skill references. **No model runner is included, and static validation does not execute the scenarios.** Prepare the case's context or disposable fixture, run each comparison configuration, and save outputs and grades under ignored `eval-results/`.

Benchmark execution may use paid models or external tools; obtain the authority required by the task before dispatch. Do not silently launch paid jobs from CI.

A rewrite is accepted only when outcome and authority requirements hold and the evidence supports its claimed improvement. More tests or more agents are useful only when they resolve a specific uncertainty.

## Sources

- [OpenAI: Rethinking skills and prompts for GPT-6 Astra](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra)
- [OpenAI: Testing Agent Skills Systematically with Evals](https://developers.openai.com/blog/eval-skills)
- [OpenAI: Build skills](https://learn.chatgpt.com/docs/build-skills)
- [Agent Skills specification](https://agentskills.io/specification)
- [Authoring best practices](https://agentskills.io/skill-creation/best-practices)
- [Evaluating skill output quality](https://agentskills.io/skill-creation/evaluating-skills)
- [Optimizing descriptions](https://agentskills.io/skill-creation/optimizing-descriptions)
