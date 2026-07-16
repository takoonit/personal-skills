---
name: shape-system-work
description: Analyse ambiguous software product or system requests, expose unstated needs and constraints, select a proportionate architecture, and break delivery into risk-first, verifiable development slices. Use for discovery, solution design, architecture proposals, MVP scoping, technical planning, backlog decomposition, build-vs-buy decisions, or when a proposed feature sounds generic, over-designed, costly, or commercially unrealistic.
---

# Shape System Work

Turn an idea into an evidence-backed system plan. Preserve the user's intent while challenging assumptions, hidden costs, and generic solutions.

## Operating principles

- Start from the decision or outcome, not the requested feature list.
- Separate facts, assumptions, constraints, and open questions. Never present inference as fact.
- Ask only questions whose answers change scope, architecture, cost, or sequencing. Otherwise state a reversible assumption and proceed.
- Prefer the smallest design that preserves the likely evolution path.
- Treat operational burden, data quality, security, pricing, and human workflow as architecture concerns.
- Find the differentiating mechanism. Reject features that merely rename a common pattern.
- Include one devil's-advocate counterpoint and one leverage point.
- Keep options to two or three. Recommend one and explain what would invalidate it.

## Workflow

### 1. Frame the real decision

Restate the request as:

`For <actor>, enable <decision/outcome> under <constraints>, measured by <observable result>.`

Identify:

- actors, jobs, and current workaround;
- desired outcome and explicit non-goals;
- business model or value exchange;
- hard constraints: time, budget, skills, integrations, regulation, accuracy, latency;
- irreversible or expensive decisions;
- evidence supplied versus assumptions being made.

If the domain depends on specialised practice, research how real practitioners work before translating it into software. Model their decisions, evidence, exceptions, and hand-offs rather than copying surface terminology.

### 2. Pressure-test the proposition

Check four lenses:

1. **User truth:** Does this solve a repeated job or merely sound attractive?
2. **Mechanism:** What makes the result materially different from a generic implementation?
3. **Economics:** Can acquisition, operation, support, and variable compute costs fit the model?
4. **Trust:** Where can wrong data, opaque logic, privacy, or overclaiming damage the user?

Name the weakest assumption and design the cheapest test for it. Distinguish MVP from a demo: an MVP must test value, not just prove that screens can be built.

### 3. Model the system before choosing technology

Define:

- core domain entities and invariants;
- primary commands, queries, and state transitions;
- system boundary and external actors;
- source of truth for each important datum;
- synchronous versus asynchronous work;
- failure, retry, audit, and manual-recovery paths;
- sensitive data and authorisation boundaries.

For rule-heavy or interpretive domains, separate layers:

1. deterministic calculation or canonical data;
2. versioned rules and profile mappings;
3. personalised composition or AI generation;
4. presentation and interaction.

Do not let an AI layer become the source of truth when deterministic rules can be encoded and tested.

### 4. Select a proportionate architecture

Generate at most three candidates: baseline, recommended, and scale-path only when materially different. Compare them on correctness, delivery speed, operating burden, cost, changeability, and team fit.

Default to a modular monolith with clear boundaries unless independent scaling, fault isolation, ownership, or deployment cadence justifies services. Prefer managed components when they remove undifferentiated operations without creating unacceptable lock-in or cost.

Record each major decision as:

- context and constraint;
- chosen option;
- rejected alternative;
- trade-off accepted;
- trigger for revisiting.

### 5. Slice delivery by proof and risk

Build a thin vertical path through UI/API/domain/data first. Order slices to retire uncertainty:

1. feasibility spike for the hardest unknown;
2. walking skeleton through the real deployment path;
3. core happy path with acceptance evidence;
4. failure, security, and recovery paths;
5. observability and operational readiness;
6. optimisation and scale only after measurement.

Each work item must contain:

- user or system outcome;
- scope and explicit exclusions;
- dependencies and decision owner;
- acceptance criteria observable from outside the implementation;
- test/evidence required;
- risk or unknown retired;
- size small enough to review and integrate safely.

Split horizontally only for enabling work that cannot produce a vertical outcome. Time-box research spikes and require a decision or artefact as their output.

### 6. Deliver a decision-ready plan

Use the smallest useful set of sections:

1. decision summary and recommendation;
2. facts, assumptions, and unresolved questions;
3. domain model and system boundaries;
4. architecture and key trade-offs;
5. risk-first delivery slices with acceptance criteria;
6. leverage point, hidden trap, and devil's-advocate counterpoint;
7. next decision or first executable step.

Add diagrams only when relationships or sequence are easier to verify visually. Use tables for exact mappings and comparisons.

## Quality gate

Before finalising, verify:

- every component traces to a requirement, constraint, or risk;
- the recommendation fits the actual team and commercial model;
- facts and assumptions are visibly distinct;
- the first slice tests a real uncertainty or user outcome;
- acceptance criteria describe evidence, not implementation activity;
- failure and recovery paths exist;
- future scale is enabled without being prepaid;
- the plan states what not to build.

Read [examples.md](references/examples.md) when a concrete worked example or output shape would help.
