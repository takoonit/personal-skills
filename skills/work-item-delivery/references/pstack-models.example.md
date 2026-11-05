# Illustrative model mappings

Examples only: these names were available in the source sessions. Select available models with `pstack:setup-pstack`; do not install this sheet as proof of account capabilities or automatically overwrite the host's settings.

## Codex

```text
feature, refactoring: gpt-6.1-sol
bug-fix: gpt-6.1-sol
perf-issue: gpt-6.1-sol
hillclimb: gpt-6.1-sol
judgment and prose: gpt-6.1-sol
strongest judgment: gpt-6-astra @high
how explorer: gpt-6.1-sol
how explainer: gpt-6.1-sol
why investigators: gpt-6.1-sol
why synthesizer: gpt-6.1-sol
reflect tooling: gpt-6.1-sol
reflect judgment, divergent, synthesizer: gpt-6.1-sol
arena runners: gpt-6.1-sol, gpt-6-astra, gpt-6-luna
arena cross-judge pool: gpt-6.1-sol, gpt-6-astra, gpt-6-luna
swarm workers: gpt-6.1-sol
architect runners: gpt-6.1-sol, gpt-6-astra, gpt-6-luna
interrogate reviewers: gpt-6.1-sol, gpt-6-astra, gpt-6-luna
default effort: medium
session hook: on
```

## Claude Code

`inherit-parent` runs a role on the session's model. Every model here is a Claude model, so a two-seat panel is two Claude models, not two model families.

```text
feature, refactoring: inherit-parent
bug-fix: inherit-parent
judgment and prose: opus @xhigh
strongest judgment: opus @xhigh
swarm workers: inherit-parent
arena runners: opus @xhigh, sonnet
arena cross-judge pool: opus @xhigh, sonnet
architect runners: opus @xhigh, sonnet
interrogate reviewers: opus @xhigh, sonnet
reflect judgment, divergent, synthesizer: opus @xhigh
default effort: session
session hook: on
```

Keep the actual role sheet in the host's configured location. Pass its resolved current values to the design checker. A missing or unavailable configured seat remains incomplete; required independent review is not replaced by one model pretending to be several reviewers.
