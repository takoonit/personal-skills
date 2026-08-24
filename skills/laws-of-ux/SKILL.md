---
name: laws-of-ux
description: "Audit or shape product interfaces and flows using UX psychology heuristics from Laws of UX. Use when a screen or journey feels confusing, slow, crowded, unfamiliar, difficult to learn or scan, easy to misclick, emotionally rough, or overloaded with choices; especially for onboarding, navigation, forms, search, checkout, loading, progress, empty and error states, and familiarity versus novelty. Select only laws supported by observable evidence, expose conflicts and misuse, propose the smallest correction, and define a validation signal. Do not use as a decorative law-name checklist, a substitute for user research or accessibility, or a licence for dark patterns."
---

# Laws of UX

Diagnose the user problem first, then use behavioural laws as testable explanations. A law earns its place only when the supplied interface, flow, research, or behaviour contains evidence for its mechanism. Prefer one strong law over a parade of impressive names.

## Coexist with local skills

Let a specialised accessibility, design-system, framework, analytics, or user-research skill own its narrower work. Reuse its confirmed constraints.

Use `$intentional-design` when the task is to create expressive, task-first UI, feedback, or interaction character. Use this skill when the task is to explain and correct behavioural friction with applicable UX laws. Use `$doakes` when the proposed interface drifts from the product's core outcome. Hand an accepted implementation to `$ship-sound-code`.

## Treat laws as hypotheses, not verdicts

UX laws describe recurring human tendencies. They are not universal commands, mathematical guarantees, or substitutes for observing the target users.

Never cite a law without all three:

1. a concrete observation from the screen, flow, research, behaviour, or code;
2. a plausible mechanism linking that observation to user friction; and
3. a correction that can be validated.

Do not use law names to make a personal preference sound scientific. When evidence is missing, label the claim as an assumption and state the smallest test needed.

Accessibility, safety, informed consent, legal obligations, privacy, data integrity, and truthful system status override a heuristic. A persuasive pattern that improves conversion by reducing user control is a failure, not a clever application of psychology.

## Choose the review mode

Use the smallest mode that answers the request:

- **Audit:** diagnose an existing screen or journey.
- **Shape:** improve a proposed flow before implementation.
- **Compare:** judge variants against the same task and evidence.
- **Brief:** translate accepted findings into implementation requirements.

When rendered appearance or interaction matters, inspect the running product, prototype, screenshot, or recording. Do not claim visual or behavioural evidence from component names and markup alone.

## Frame the task and evidence

State the user task as:

`For <user>, in <context>, complete <task> while <constraint>.`

Record the evidence source: direct research, usability observation, support issue, analytics, screenshot, prototype, recording, implementation, or user report. Distinguish fact from inference.

Classify the dominant friction before selecting a law:

- **find:** the user cannot locate the relevant thing;
- **understand:** meaning, hierarchy, or consequence is unclear;
- **decide:** choices are difficult to compare or commit to;
- **act:** the intended control is difficult, error-prone, or ambiguous;
- **wait:** delay or system status breaks attention and trust;
- **remember:** the interface makes the user retain avoidable information;
- **learn:** the user must understand an unfamiliar system or feature;
- **recover:** an error or interruption leaves no safe path forward; or
- **finish:** the peak, confirmation, or ending damages the remembered experience.

If several are present, prioritise the one blocking task completion or creating the greatest user risk.

## Select no more than three laws

Use `references/law-catalogue.md` for the complete catalogue and misuse notes. Route quickly by the observed friction:

| Friction | Strong candidates |
| --- | --- |
| Find and scan | Selective Attention, Law of Proximity, Law of Similarity, Law of Common Region, Law of Uniform Connectedness, Von Restorff Effect |
| Understand and remember | Cognitive Load, Working Memory, Chunking, Mental Model, Miller's Law, Jakob's Law |
| Decide | Hick's Law, Choice Overload, Chunking, Serial Position Effect |
| Act | Fitts's Law, Doherty Threshold, Paradox of the Active User |
| Learn | Paradox of the Active User, Jakob's Law, Mental Model, Cognitive Load |
| Progress and momentum | Goal-Gradient Effect, Zeigarnik Effect, Flow, Doherty Threshold |
| Complexity and scope | Tesler's Law, Occam's Razor, Pareto Principle, Parkinson's Law, Postel's Law |
| Recall and emotion | Peak-End Rule, Serial Position Effect, Aesthetic-Usability Effect |

Do not select multiple laws that merely rename the same observation. Cognitive Load, Working Memory, Miller's Law, and Chunking often overlap; choose the one that gives the clearest corrective action.

## Apply the evidence chain

For each material finding, write this chain:

`Observation -> law and mechanism -> smallest correction -> collision or cost -> validation.`

A valid finding answers all five:

1. **Observation:** What can be seen or measured? Avoid vague claims such as "too complex".
2. **Mechanism:** Why is this law relevant to the user's task and context?
3. **Smallest correction:** What is the least disruptive change that removes the friction?
4. **Collision or cost:** Which other law, user need, business constraint, or safety requirement could oppose it?
5. **Validation:** What behaviour would show improvement, and what result would falsify the recommendation?

Reject a finding that cannot move beyond a generic instruction such as "make it simpler", "reduce cognitive load", or "follow Fitts's Law".

## Resolve common law collisions

### Familiarity versus novelty

Jakob's Law favours familiar core patterns, but familiarity is not a ban on invention. Keep commodity actions recognisable. Introduce novelty only when it materially improves the task, enables a new capability, supports deliberate exploration, or creates meaningful differentiation. Test the unfamiliar interaction with the intended audience.

### Fewer choices versus discoverability

Hick's Law and Choice Overload do not mean hiding every option. Prioritise, group, sequence, recommend, search, or progressively disclose choices while preserving a clear route to the full set. A clean interface that conceals necessary options has merely exchanged decision cost for discovery cost.

### Simplicity versus conserved complexity

Occam's Razor removes accidental assumptions and unnecessary interface. Tesler's Law warns that inherent complexity still has to live somewhere. Move repeatable work into sensible defaults, automation, remembered context, and system logic, but keep consequential choices and system state visible.

### Speed versus truth

The Doherty Threshold supports rapid acknowledgement, not fabricated completion. Respond immediately where possible, then show honest pending, success, failure, and recovery states. Optimistic UI must reconcile with the server and make reversal clear.

### Progress versus pressure

Goal-Gradient and Zeigarnik effects can support a user-chosen goal with accurate progress and resumability. Do not manufacture incomplete tasks, false urgency, streak anxiety, arbitrary badges, or endless loops merely to increase return frequency.

### Memorable moments versus root causes

Peak-End design cannot rescue a broken journey. Fix severe failure, hidden cost, data loss, or confusing recovery before adding humour, animation, celebration, or branded error copy. Delight should reinforce a real success, not camouflage pain.

### Tolerance versus security

Apply Postel's Law cautiously. Human-facing input may accept harmless formatting variations, but security boundaries, APIs, stored data, and protocol output require explicit validation, canonicalisation, limits, and clear failure. Never turn "be liberal in what you accept" into ambiguous or unsafe parsing.

### High impact versus exclusion

Pareto prioritisation can focus effort on common and costly paths. It does not waive accessibility, safety, privacy, or critical edge cases. Low-frequency catastrophic failures remain high priority.

## Use article-derived defaults

The Laws of UX articles support these practical defaults. See `references/article-synthesis.md` for the source-by-source synthesis.

- Start with familiar patterns. Spend novelty where it creates real product value, exploration, or a capability that familiar patterns cannot express.
- Let active users begin. Teach through contextual, progressive, recoverable guidance rather than compulsory tours and front-loaded manuals.
- Absorb repeatable complexity in the system, but do not abstract away consequential choices, status, or control.
- Reduce extraneous mental work, not useful information. Prefer grouping, sensible defaults, preserved context, readable type, labelled icons, and fewer avoidable decisions.
- Make entry, search, status, and results fast to understand and easy to scan. Preserve the user's query and current context.
- Fix the critical journey first, then design its emotional peak, recovery, and ending deliberately.
- Edit ruthlessly. Every element should help the user find, understand, decide, act, recover, or finish.

## Make the smallest intervention

Prefer a targeted move over a wholesale redesign:

- remove or merge redundant content;
- group related choices and separate unrelated ones;
- improve label, hierarchy, spacing, hit area, or control position;
- reuse known information through a safe default or prefill;
- preserve current context instead of asking the user to remember it;
- reveal unfamiliar guidance at the moment it becomes relevant;
- acknowledge an action immediately and expose honest progress;
- add undo, retry, resume, or a clear recovery path; or
- strengthen the final confirmation and next useful action.

Do not redesign information architecture, introduce novel navigation, or remove consequential explanation unless the evidence requires it. Preserve accessibility names, keyboard operation, reduced-motion support, focus order, contrast, error association, and touch target safety.

## Validate by task, not applause

Choose a validation signal that matches the friction:

| Friction | Useful evidence |
| --- | --- |
| Find | time to first correct action, wrong-path rate, search reformulation |
| Understand | comprehension, correct prediction of consequence, error rate |
| Decide | decision time, comparison success, abandonment, confidence with rationale |
| Act | task completion, misclicks, repeat submissions, recovery success |
| Wait | repeat actions, abandonment, perceived wait, trust in status |
| Remember | backtracking, copy-and-paste workarounds, memory errors |
| Learn | time to first value, independent success, contextual help use |
| Recover | successful retry, data preserved, support contact rate |
| Finish | completion, clarity of outcome, next-step success, later recall |

Conversion, engagement, or time spent alone do not prove better UX. Pair business outcomes with task success, comprehension, error, recovery, and user control.

## Reject common cargo-cult applications

- Do not cap menus or navigation at seven items because of Miller's Law.
- Do not remove necessary choices merely to cite Hick's Law.
- Do not make every primary action enormous because of Fitts's Law.
- Do not hide core features behind progressive disclosure to make a screen look clean.
- Do not use a polished visual layer to dismiss observed usability faults.
- Do not make every card, colour, border, and animation compete for selective attention.
- Do not add confetti, mascots, or jokes to an error before repairing recovery.
- Do not use fake progress, streak loss, unfinished-task anxiety, or fabricated scarcity.
- Do not apply Postel's Law loosely at trust or security boundaries.
- Do not present a list of laws without a prioritised recommendation.

## Report decisively

Return a concise default report:

**Verdict:** Clear, friction, risk, or evidence gap.

**Task:** The framed user task and context.

**Evidence:** What was observed, and which parts are inferred.

Then provide no more than three findings:

`<Law> - <observation>; <mechanism>; <smallest correction>; <collision or cost>; <validation signal>.`

Add one short **Counterpoint** only when a reasonable alternative could change the decision.

End with **Direction:** the leanest viable change, in priority order. When the request is implementation-ready, hand off explicit behaviour, states, constraints, and acceptance checks to `$ship-sound-code` rather than repeating the law catalogue.
