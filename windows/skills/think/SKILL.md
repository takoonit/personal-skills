---
name: think
description: "Apply a 10-stage OBSERVE, OBSERVE, LISTEN, THINK, CONNECT, CONNECT, FEEL, ACCEPT, CREATE, GROW reasoning loop to consequential or ambiguous decisions — including when requirements, business meaning or vault notes conflict. Use for think this through, deep think, architecture review, postmortem, tradeoff analysis, conflicting requirements, or challenging assumptions. Read-only reasoning review; not a vault health check or repair. Native Windows: no scripts or WSL."
---

# Think

Adapted from claude-obsidian's `think` skill (MIT, © 2026 AgriciDaniel). It
needs no runtime, so it works the same on native Windows.

Use the ten stages as a loop of attention, not a ceremonial transcript. Scale
depth to novelty, stakes, uncertainty and irreversibility. Keep the final
summary concise and evidence-bearing.

This skill is read-only. It may inspect evidence (code, ADO work items,
Confluence pages, vault notes via `wiki-query`), but it does not edit files,
commit, publish, or change a work item. If CREATE recommends a change, hand it
to the appropriate skill after the user authorizes it.

## Evidence frame

Before the loop, separate:

- **Observed** — directly supported by an input, source, test or measurement.
- **Inferred** — a conclusion from observations; state the bridge.
- **Unknown** — missing evidence that could change the decision.
- **Preference** — a user or designer choice, not a factual claim.

Attach concrete locators (file:line, `[[Note#Heading]]`, Confluence page +
version + section, work item ID + revision). Never fabricate a quotation,
locator, test result, consensus or confidence.

When sources disagree (ticket acceptance criteria vs. Confluence spec vs. vault
note vs. observed code vs. deployed behavior), keep them as separate claims
with their own authority. Do not merge them into one "requirement".

## The ten stages

1. **OBSERVE — external.** Read the actual inputs, current state, constraints,
   failures and prior work. Distinguish what was read in full from what was
   sampled or assumed.
2. **OBSERVE — internal.** Name the biases most likely to distort this
   decision: anchoring, ownership, novelty, familiarity, urgency, sunk cost,
   confirmation, a desired verdict. Recalibrate confidence.
3. **LISTEN.** Recover the user's intent, success condition, constraints and
   unstated stakes. Attend to error messages, dissent and edge cases. Ask only
   questions whose answers could change the outcome.
4. **THINK.** Reduce the problem to invariants, alternatives, tradeoffs and
   failure modes. Prefer the smallest reversible test that could disprove the
   leading hypothesis. Failure behavior is part of the specification.
5. **CONNECT — lateral.** Look for the same structure in adjacent components or
   another domain. Use an analogy only with its mapped similarities and limits
   stated.
6. **CONNECT — system.** Trace upstream inputs, downstream consumers,
   ownership, state boundaries, interfaces and recovery paths. Check whether a
   locally sound decision breaks integration elsewhere.
7. **FEEL.** Consider the user's cognitive load, trust, accessibility and
   error-recovery experience. Intuition is a signal to investigate, not
   evidence.
8. **ACCEPT.** State constraints, uncertainty, contradictions and unfavorable
   findings plainly. Do not inflate, soften a material risk, or mistake
   agreement for correctness. Give the strongest counterargument.
9. **CREATE.** Produce the smallest useful artifact: recommendation, decision
   record, experiment, draft, review or handoff. Mark assumptions and open
   risks. Do not mutate state here.
10. **GROW.** Define what feedback or measurement should update the decision,
    when to revisit it, and the reusable lesson. Saving it is a separate,
    explicit operation.

## Verification discipline

Before calling the work complete:

1. Test the highest-risk claim, or state why it remains untested.
2. Seek disconfirming evidence, not only supporting examples.
3. Match verification effort to blast radius and reversibility.
4. Report the actual commands, sources, artifacts or observations used.
5. Separate a passing check from the broader correctness it does not establish.
6. Give confidence as a calibrated qualitative judgment with reasons, not a
   decorative percentage.

## Output shape

Adapt headings to the task but keep these outcomes:

```markdown
## Decision
<recommendation or artifact>

## Evidence
<observed facts and important inferences, with locators>

## Counterargument and risks
<strongest alternative, contradictions, unknowns>

## Verification
<checks performed and checks still needed>

## Growth loop
<feedback signal, revisit condition, reusable lesson>
```

For a trivial, reversible lookup or typo, skip the formal loop. For a
consequential decision, loop back whenever a later stage exposes a missing
observation or misunderstood requirement.
