# Evidence strength and transfer guide

Use this reference to keep behavioural UX reasoning proportionate to the evidence. It is intentionally stricter than popular UX-law summaries.

## Evidence ladder

Treat evidence quality and context match as separate questions.

### A. Direct task evidence

Strongest for deciding what to change in this product.

Examples:
- moderated or unmoderated usability observation on the target task;
- repeated support failures with a consistent behavioural pattern;
- interaction recordings that show the failure directly;
- controlled experiment with a task-relevant outcome;
- reliable production telemetry tied to a specific action sequence.

Limit: direct evidence shows what happened in this context, but not necessarily why. Do not infer mechanism from metrics alone.

### B. Established behavioural mechanism

Useful when the mechanism has robust empirical grounding and the target task resembles the studied phenomenon.

Examples include:
- limited working-memory capacity;
- target acquisition effects captured by Fitts-style models;
- reaction-time effects under structured choice tasks;
- Gestalt grouping tendencies;
- serial-position effects;
- selective attention.

Limit: transfer weakens when device, expertise, stakes, time pressure, information structure, or interaction mode differs materially from the studied context.

### C. Applied UX heuristic

Useful operationally, but not a law of nature.

Examples include:
- Jakob's Law;
- Paradox of the Active User;
- aesthetic-usability effect as applied to product design;
- practical interpretations of Peak-End in journeys;
- Tesler and Occam as design reasoning aids.

Use these to generate hypotheses, not to close debate.

### D. Aphorism or weakly specified rule

Treat as low confidence unless supported by direct task evidence.

Examples include:
- exact 7±2 menu limits attributed to Miller;
- exact 400 ms product-wide thresholds attributed to Doherty;
- literal 80/20 expectations from Pareto;
- claims that one law universally dominates another.

Do not turn these into acceptance criteria without independent evidence.

## Confidence is contextual

A finding is **High confidence** only when direct task evidence and a credible mechanism point in the same direction.

A finding is **Moderate confidence** when the mechanism is credible but transfer to this context is uncertain, or direct evidence is suggestive but causal explanation is incomplete.

A finding is **Low confidence** when it relies mainly on a heuristic, analogy, weakly specified law, or untested assumption.

## Common research corrections

### Miller's Law

Do not use "seven plus or minus two" as an interface item cap. Miller's original paper was not a universal menu-design rule, and later work such as Cowan's review argues for a smaller focal capacity, commonly around three to five chunks under constrained conditions. The useful design move is to reduce recall burden, preserve context, and form meaningful chunks.

### Hick / Hyman

Choice-response time generally increases with information/uncertainty in structured tasks, but product decisions are affected by search, familiarity, grouping, defaults, expertise, consequences, and comparison structure. The corrective action is often better organisation, not simply fewer options.

### Fitts

Fitts-style models describe movement time as a function of target distance and size. They support adequate hit areas and convenient placement, especially for frequent actions. They do not determine visual hierarchy by themselves and must not make destructive actions easier to trigger accidentally.

### Doherty threshold

Treat rapid acknowledgement as the durable lesson. Do not convert a historical 400 ms figure into a universal SLA. Networked systems, mobile devices, animation, asynchronous work, optimistic UI, and accessibility all change what users perceive as responsive.

### Gestalt principles

Grouping effects are robust as perceptual tendencies, but they are descriptive rather than prescriptive. Proximity, similarity, common region, and connectedness can conflict. Test whether the resulting grouping matches the user's task, not whether the layout looks theoretically tidy.

### Peak-End and Zeigarnik

These effects are context-sensitive and easy to overextend in product design. Use them cautiously for journey endings, resumability, and unfinished work. Never use them to justify pressure, anxiety, artificial incompleteness, or compulsive engagement.

## Accessibility and neurodiversity transfer checks

Before using a behavioural law, ask whether the recommendation assumes a narrow mode of perception, memory, motor control, or attention.

Check at least:
- keyboard and screen-reader paths;
- non-pointer input;
- target size and spacing;
- reduced motion;
- persistent labels instead of icon-only memory tests;
- visible system state;
- tolerance for slower reading or decision making;
- avoidance of unnecessary time pressure and flashing/motion competition;
- preserved context across steps.

Accessibility requirements outrank heuristic optimisation.

## Ethical stop conditions

Reject a recommendation if its success depends on making a legitimate alternative harder to notice, understand, select, undo, or leave.

High-risk patterns include:
- false urgency or scarcity;
- misleading defaults or preselection;
- obstructed cancellation or opt-out;
- hidden fees or delayed disclosure;
- confirm-shaming;
- forced disclosure unrelated to the task;
- visual interference that privileges the business-preferred choice;
- progress or streak mechanics designed to create anxiety rather than support a chosen goal.

If the business metric improves while informed choice, comprehension, recovery, or user control worsens, classify the result as a UX failure.

## Selection rule for agents

For each candidate law, score mentally on three dimensions:

1. **Evidence:** is the friction directly observed or merely assumed?
2. **Mechanism fit:** does this law explain this behaviour better than a simpler mechanism?
3. **Action value:** does invoking the law change the correction or validation plan?

Drop the law if it fails any two dimensions. Prefer one strong mechanism over three decorative names.

## Validation standard

A recommendation is incomplete until it states what would disconfirm it.

Examples:
- "If grouping is the issue, the revised layout should reduce wrong-path selections without increasing time to locate secondary actions."
- "If recall burden is the issue, preserving the prior value should reduce backtracking and memory errors."
- "If target acquisition is the issue, enlarging or repositioning the control should reduce mis-taps without increasing accidental destructive actions."

Business metrics may be included, but never as the only UX success criterion.