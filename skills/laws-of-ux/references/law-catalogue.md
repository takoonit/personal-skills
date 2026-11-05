# UX law catalogue and misuse checks

This catalogue is an original practical synthesis of the 30 English law and principle cards on `https://lawsofux.com/laws/`, `https://lawsofux.com/laws/page/2/`, and `https://lawsofux.com/laws/page/3/`, accessed on 25 August 2026. Use it as a routing aid, not as proof by citation.

## Perception, hierarchy, and grouping

### Aesthetic-Usability Effect

People often perceive a visually coherent interface as easier to use.

- **Useful move:** use polish, rhythm, consistency, and clear hierarchy to support confidence and comprehension.
- **Misuse:** treating beauty as evidence that task flow, accessibility, or error recovery works.

### Law of Common Region

Elements inside the same visible boundary are perceived as a group.

- **Useful move:** place controls and information that belong to one decision inside a clear shared region.
- **Misuse:** boxing every element until the interface becomes a field of competing containers.

### Law of Proximity

Nearby elements are perceived as related.

- **Useful move:** use spacing to express groups before adding borders and labels.
- **Misuse:** placing unrelated items close together or using equal spacing where hierarchy differs.

### Law of Prägnanz

People tend to interpret ambiguous or complex forms as the simplest stable form available.

- **Useful move:** prefer clear silhouettes, hierarchy, and predictable structures.
- **Misuse:** stripping away context until the interface is visually simple but semantically vague.

### Law of Similarity

Visually similar elements are perceived as related or equivalent.

- **Useful move:** make controls with the same behaviour look consistent and distinguish different consequences.
- **Misuse:** styling destructive, secondary, and primary actions as if they were interchangeable.

### Law of Uniform Connectedness

Visually connected elements are perceived as more related than unconnected ones.

- **Useful move:** use lines, shared backgrounds, or direct connectors where relationships are otherwise difficult to infer.
- **Misuse:** creating connector clutter or implying a relationship that does not exist.

### Selective Attention

People focus on a subset of available stimuli, usually those related to their current goal.

- **Useful move:** make the next relevant action and critical status prominent while quieting unrelated content.
- **Misuse:** exploiting attention with false urgency, motion, or visual competition.

### Von Restorff Effect

A distinctive item among similar items is more likely to be noticed and remembered.

- **Useful move:** reserve visual distinction for one truly important action, status, or exception.
- **Misuse:** making several elements unique, which destroys the contrast, or relying on colour alone.

## Choice, cognition, and memory

### Choice Overload

Large, undifferentiated option sets can overwhelm people and reduce confident choice.

- **Useful move:** prioritise, group, recommend, filter, search, or sequence while preserving access to the full set.
- **Misuse:** removing meaningful alternatives to force a preferred conversion.

### Chunking

Related pieces of information become easier to process when grouped into meaningful units.

- **Useful move:** structure content by task, concept, or decision and give each chunk a clear boundary.
- **Misuse:** turning every sentence into a card or creating arbitrary groups with no semantic value.

### Cognitive Bias

Human judgement contains systematic tendencies that can affect perception and decisions.

- **Useful move:** name the specific bias, context, and observable behaviour before designing around it.
- **Misuse:** citing "cognitive bias" as a vague explanation for any behaviour or using it to manipulate users.

### Cognitive Load

An interface consumes limited mental resources for understanding and action.

- **Useful move:** reduce extraneous learning, remembering, switching, and comparison work while preserving necessary information.
- **Misuse:** equating low cognitive load with fewer visible elements regardless of discoverability or clarity.

### Hick's Law

Decision time tends to increase with the number and complexity of choices.

- **Useful move:** prioritise, group, set safe defaults, and reveal advanced choices when relevant.
- **Misuse:** hiding all but one option or claiming that every interface needs fewer items.

### Mental Model

People use a compressed internal model of how a system works to predict outcomes.

- **Useful move:** align cause and effect with existing expectations or teach the difference through immediate feedback.
- **Misuse:** assuming the designer's conceptual model is shared by users.

### Miller's Law

Working memory is limited, but the familiar "seven plus or minus two" finding is not a universal interface item limit.

- **Useful move:** chunk information, preserve context, and externalise state so the user need not remember it.
- **Misuse:** capping menus, tabs, cards, or navigation at seven without task evidence.

### Serial Position Effect

People tend to remember items near the beginning and end of a sequence better than those in the middle.

- **Useful move:** place critical orientation early and the decisive action or summary at the end.
- **Misuse:** burying essential material in the middle or repeatedly reordering stable lists merely for prominence.

### Working Memory

Working memory temporarily holds and manipulates information needed for the current task.

- **Useful move:** keep prior input, comparison context, instructions, and progress visible at the decision point.
- **Misuse:** testing memory through multi-step flows that could preserve the information for the user.

## Familiarity, learning, and action

### Fitts's Law

Target acquisition becomes easier when a target is larger and closer to the pointer or touch position.

- **Useful move:** provide sufficient hit areas and convenient placement for frequent, safe, important actions.
- **Misuse:** making destructive actions dominant, ignoring motor accessibility, or enlarging everything equally.

### Jakob's Law

People bring expectations formed by other products and prefer familiar interactions for familiar tasks.

- **Useful move:** keep commodity controls and navigation recognisable, then spend novelty where it creates material value.
- **Misuse:** copying competitors blindly or rejecting any innovation.

### Paradox of the Active User

Many users begin using software immediately rather than reading instructions first.

- **Useful move:** support learn-by-doing with contextual guidance, safe defaults, examples, templates, and recovery.
- **Misuse:** withholding necessary orientation or showering users with unsolicited tooltips.

### Postel's Law

A system can be tolerant of harmless input variation while producing clear, consistent output.

- **Useful move:** accept benign formatting differences in human input, then canonicalise and communicate the result.
- **Misuse:** permissive parsing at security, protocol, financial, or data-integrity boundaries.

## Time, feedback, progress, and experience

### Doherty Threshold

Rapid interaction and feedback help people maintain attention and productivity.

- **Useful move:** acknowledge actions immediately, keep common interactions fast, and show honest progress when work takes longer.
- **Misuse:** treating 400 ms as a universal service-level objective or showing success before the operation is secure.

### Flow

Clear goals, balanced challenge, focused attention, and immediate feedback can create deep task engagement.

- **Useful move:** remove avoidable interruption and keep progress and next actions clear in skilled, sustained work.
- **Misuse:** engineering endless engagement, removing stopping points, or labelling compulsion as flow.

### Goal-Gradient Effect

Motivation often increases as a person perceives themselves nearing a goal.

- **Useful move:** show accurate progress towards a user-chosen outcome and make the remaining work understandable.
- **Misuse:** fake progress, arbitrary completion theatre, or pressure to finish a goal the user did not choose.

### Peak-End Rule

People often judge an experience disproportionately through its most intense moment and its ending.

- **Useful move:** map anxiety, success, failure, recovery, and final confirmation; strengthen the real peak and ending.
- **Misuse:** adding celebration or humour while leaving serious journey failures unresolved.

### Zeigarnik Effect

Incomplete or interrupted tasks can remain more mentally salient than completed ones.

- **Useful move:** preserve drafts, show resumable state, and make legitimate unfinished work easy to continue or dismiss.
- **Misuse:** creating anxiety, streak loss, red badges, or artificial incompleteness to force return.

## Complexity, scope, and prioritisation

### Occam's Razor

When alternatives explain and perform equally well, prefer the one with fewer assumptions and unnecessary parts.

- **Useful move:** start with the simplest sufficient flow and require each extra element to earn its place.
- **Misuse:** removing context, control, or safety merely to achieve visual minimalism.

### Pareto Principle

A minority of causes often account for a large share of effects.

- **Useful move:** find the common or costly tasks and failures that deserve disproportionate attention.
- **Misuse:** treating the 80/20 ratio as exact or ignoring low-frequency catastrophic and accessibility cases.

### Parkinson's Law

Work tends to expand to fill the time available.

- **Useful move:** bound design questions, prototype the decisive risk, and define a stopping rule.
- **Misuse:** using arbitrary urgency to skip research, accessibility, safety, or verification.

### Tesler's Law

A system contains some complexity that cannot simply be deleted; it must be carried by the system or the user.

- **Useful move:** absorb repeatable work through defaults, automation, prediction, and remembered context while exposing consequential state.
- **Misuse:** hiding complexity so thoroughly that users lose control, understanding, or recovery.

## Law selection discipline

Before applying a law, answer:

1. What exact behaviour or interface evidence activates it?
2. What user task and context make the mechanism plausible?
3. What is the smallest change implied by this law?
4. Which law or constraint could argue against that change?
5. What result would show the law was the wrong explanation?

If those questions cannot be answered, do not use the law in the recommendation.
