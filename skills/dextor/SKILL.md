---
name: dextor
description: "Run an explicit code-hygiene review for avoidable complexity, dead code, dependency/configuration bloat, and unnecessary project surface. Use when bloat is suspected or at a material review checkpoint; do not use as general implementation or routine code review. Produce evidence-backed kill candidates and ask before removal or material refactoring."
---

# Dextor

Run a brief, evidence-led hygiene pass. Preserve behaviour and local conventions; reduce maintenance cost only where there is a concrete, present benefit.

## Coexist with local skills

If a user-invoked or active local skill has a narrower declared scope, let it own that specialised work. Reuse its confirmed artefacts; do not repeat its planning, edits, or tests. Retain only this skill's bloat and safe-removal role; ask the user if ownership remains genuinely unclear.

## Choose the moment

Run once per meaningful slice, pull request, or explicit review—not after every small edit. Prioritise changed code and its direct dependencies. Skip a broad scan when the task is a time-critical incident unless the suspected bloat contributes to the incident.

Use `$ship-sound-code` for the implementation workflow. Dextor supplies a focused challenge and does not reopen settled product or architecture decisions without evidence.

Treat dependency, licence, security, performance, or framework-review findings from other local skills as input evidence, not as a reason to duplicate their audit. Do not inspect every new dependency or abstraction by default; intervene when its present cost, redundancy, or lack of consumer is plausible.

## Inspect proportionately

Read repository instructions, the changed files, nearby tests, package/build scripts, and direct callers. Check only categories supported by the change:

- unreachable, duplicated, obsolete, or redundant code, exports, assets, flags, tests, comments, and configuration;
- abstractions, layers, factories, wrappers, state, hooks, utilities, or feature flags with no present consumer or variation;
- dependencies, build steps, services, packages, environment variables, and infrastructure that add cost or failure surface without a demonstrated need;
- unclear or over-broad boundaries: `any`, loosely validated inputs, hidden side effects, mutable globals, leaking framework details, or logic in transport/UI glue;
- accidental complexity: copy-paste drift, indirection that obscures a simple path, speculative optimisation, unnecessary async work, or mismatched local patterns.

Do not label a preference as a smell. Do not report a concern merely because it is unfamiliar, older, or imperfect. Ignore generated files and deliberate compatibility scaffolding unless evidence shows it is safe and valuable to remove.

## Establish evidence

Trace references, runtime entry points, configuration, scripts, tests, public contracts, and dynamic loading before calling something unused. Treat reflection, routes, environment-selected code, plugins, migrations, serialisation, and deployment configuration as potentially live until verified.

For each candidate, state:

1. **Evidence:** the exact files, callers, duplication, cost, or failure mode.
2. **Present impact:** maintenance, defect, performance, security, DX, UX, or operational cost now.
3. **Removal safety:** observable behaviour affected, compatibility risk, and the proof needed after removal.

Prefer a measured cost, failing test, call trace, build output, or concrete maintenance example to a generic best-practice claim. Do not invent performance or security impact.

## Make the kill decision explicit

Classify findings before proposing action:

- **Kill now:** safe deletion or simplification with clear evidence and a small verification path.
- **Refactor later:** a real issue whose removal changes a public contract, data, module boundary, or several features. Explain the staged option and ask for a separate decision.
- **Keep:** deliberate complexity or an unproven suspicion. Record only when it prevents a likely false positive.

Never delete code, packages, configuration, tests, migrations, data, public APIs, or compatibility paths without explicit user approval. An approved task to use Dextor authorises inspection and recommendation, not removal.

When a kill is justified, ask plainly: `May I remove these candidates?` Include the files, expected gain, user-visible or compatibility risk, and verification command or test. Group only independent, reversible removals; keep uncertain or material changes separate.

After approval, make the smallest change, remove related dead references, and run the focused verification. Stop and report if evidence contradicts the initial conclusion.

## Feed hygiene findings forward

Report only material feedback as: **finding → evidence → present impact → route/owner → required action → closure proof**. Route a kill candidate to the user for approval, a material redesign to `$ship-sound-code`, and high-risk post-removal proof to `$lundy`. Close a removal only after approval and the named reference, build, test, or runtime proof succeeds.

## Report concisely

Return no more than three material candidates by default:

- **Kill candidate — <name>:** evidence; present cost; removal scope; verification.
- **Retain or defer — <name>:** reason it is unsafe or not yet proven.
- **Verdict:** no meaningful bloat found, or the one recommended next action.

End with the approval question only when at least one safe kill candidate exists. If nothing is proven, say so without manufacturing findings.
