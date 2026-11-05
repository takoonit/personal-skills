---
name: design-guide
description: "Apply whenever a task involves visual design or user experience, even as part of coding or another workflow and without an explicit skill mention. Covers design discussion, planning, creation, implementation, fixes, review and polish of UI, pages, components, layouts, typography, colour, imagery, visual assets, interaction, motion, responsive behaviour and accessibility, including visual design in documents or presentations. Preserve and enforce existing design rules during ongoing work; establish one of seven styles, all six techniques and DESIGN.md plus concise guardrails when a new or revised web/app design system is needed. Work alongside specialist skills. Purely internal architecture, database or API design without visual/UX impact is outside this skill's scope."
---

# Design Guide

Keep design intent active throughout every task with visual or UX impact. Read existing evidence, apply the relevant rules and verify the changed experience. When establishing a design system, turn the user's purpose into a small contract and apply **all six techniques to whichever one of the seven styles is selected**.

## Activate early and stay proportionate

Treat design as part of the work whenever appearance, hierarchy, content presentation, interaction, feedback or accessibility is affected. A settled system or small CSS/component fix is a reason to use the lightweight path, not to skip this skill. Re-enter the design check if visual/UX impact emerges during an initially non-design task.

Use the appropriate path without asking the user to choose a mode:
- **Ongoing work:** read the applicable design authority/guardrails and affected components. Reuse the selected style, tokens and six-technique decisions; make the requested change and review only the affected rules/states. If documents are absent, infer scoped constraints from coherent nearby code/assets and label uncertainty. Missing documents alone do not block a small fix or authorise new governance files.
- **New or deliberately revised system:** follow the full discovery, style selection, six-technique and document workflow below. Reuse already settled decisions and authorisation.
- **Review or design advice:** apply the relevant guide/foundations and answer or report findings. Stay read-only unless changes are requested. General design questions do not require a project target or output files.

Apply the six techniques at the system or surface level. A button change must preserve the established focal hierarchy, motif and depth; it need not contain a hero or introduce a fresh variation. Reopen a settled technique only when the task changes that decision. Load just the affected profile guidance; do not repeat interviews, style selection, document generation or full-site audits on each edit.

Work alongside Impeccable, Intentional Design, Ship Sound Code and format-specific skills when available. Let the relevant specialist own its implementation mechanics or interaction analysis; contribute design constraints and scoped review without duplicating plans or approvals. Their absence does not block the requested work. For assets, documents and presentations, use the medium's existing visual authority and specialist conventions; do not force web files, CSS tokens or a seven-style classification onto every artefact.

## Deliverable and boundaries

When establishing, intentionally revising or explicitly documenting a web/app design system, write or update two files in the target project:
- `DESIGN.md`: visual authority, chosen style, concrete rules and token/component mapping.
- `DESIGN-GUARDRAILS.md`: concise instructions builders read before edits and verify afterwards.

Reuse the incumbent design filename and path, including `Design.md`; never create a case-only duplicate. Keep guardrails beside it. Read applicable repo instructions first and preserve unrelated authored content. Establish the target before writes when several projects are possible.

For a design-document request, deliver documents; for an implementation/fix request, complete the authorised implementation with design guidance active. During ongoing work, update documents only for an intentional change to their rules, not as a record of every edit. Add the project instruction pointer when creating/updating the contract, as described below. Do not install tools, enable hooks, create issues, publish, or redesign unrelated screens as a side effect.

## Route from ordinary language

| Intent | Action |
|---|---|
| Build / fix / polish a UI or component | Use the lightweight ongoing-work path; establish direction only if genuinely missing for the requested scope. |
| Design within another task or medium | Apply relevant visual/UX rules alongside the task owner; preserve the medium's conventions. |
| Explain / compare a design approach | Answer the question using relevant guidance; no compulsory interview or document writes. |
| Help choose / interview me | Read context, then ask the next material question. |
| Analyse repo / document system | Extract the incumbent; distinguish deliberate rules from drift. |
| Use this style / redesign | Honour the pinned direction and replacement scope. |
| You decide / no questions | Decide from evidence; label assumptions without inventing user approval. |
| Check compliance | Run the review gate; stay read-only unless fixes are requested. |
| Project work with no discoverable target/context | Ask only the missing target or main user action needed to proceed; do not show a command menu. |

## 1. Read before asking

Inspect provided briefs, agent instructions, existing design/product docs, package/config files, tokens, global styles, representative screens, shared components and available assets. Start narrow with `rg`; skip dependencies, build output and unrelated code. Use screenshots or a running app through permitted tools when available. Never claim visual inspection from code alone.

Establish audience situation, primary task, scope, success, and binding brand/content/platform/language/accessibility constraints. Classify the surface's job: deciding/buying, completing a recurring task, reading/learning, or exploring an experience. This affects expression without changing the primary style.

Distinguish **observed**, **explicitly requested**, **agent-proposed**, and **unknown**. Record short evidence pointers. A coherent interface is evidence even without DESIGN.md. Identify normative tokens/components; do not promote conflicting one-off CSS into design rules.

## 2. Ask the smallest useful question

Read [interview.md](references/interview.md) when material context is missing.

Ask one focused question by default; batch up to three related questions only when helpful. Offer two or three concrete choices, your recommendation and its trade-off. Describe the experience before naming a style. Never demand design jargon or CSS values.

Skip answered questions and facts discoverable in the repo. Reuse explicit authorisation and settled direction. If the user delegates, proceed. If an optional question receives no answer, use a provisional assumption; silence is not approval. Resolve genuinely blocking scope/access ambiguity before dependent writes while continuing independent inspection.

## 3. Choose one style

Read [styles.md](references/styles.md) for selection and [foundations.md](references/foundations.md) for shared rules. Choose exactly one primary style, then load its detailed guide from Resources; do not load every profile:
1. Neoskeuomorphism
2. Kinetic typography
3. Intentional minimalism
4. Editorial design
5. Story-driven animation
6. Human-made design
7. Expressive design

Choose from purpose, content, audience context, existing identity and delivery constraints. Do not default every product to minimalism, equate age with taste, or present trend coverage as measured popularity. Treat audience fit as a hypothesis unless supported by research.

For an open choice, recommend the strongest fit and briefly compare its best alternative. A user-pinned style wins. In documentation, identify the closest primary style without changing the incumbent to fit a stereotype. If none honestly fits, expose the mismatch and propose an adaptation as provisional rather than relabelling it as fact.

Record selection provenance: **user-selected**, **agent-selected under delegation**, **inferred from incumbent**, or **provisional**. Keep one primary style; techniques do not count as extra styles. Derive actual fonts, colours and materials from this project instead of a generic preset.

Use the selected guide to resolve composition, type, colour, imagery, shapes/depth, components/states, motion, mobile behaviour and delivery constraints. Its defaults are recommendations, not universal rules. Explicit constraints, accessibility needs and coherent incumbent decisions take precedence. In documentation-only work, extract existing rules and label mismatches/advice; do not silently redesign the system to match a profile.

Select three to five project-specific binding style rules, with scope and observable evidence. Preserve the style's distinctive grammar while scaling its intensity to marketing, reading, repeated tasks or critical actions. For example, kinetic typography needs a readable resting message; expressive design needs a coherent shape/depth grammar. Do not substitute generic “make it premium” adjectives for these decisions.

## 4. Apply all six techniques

Resolve every row for every style. In a new direction or authorised redesign, apply all six; quiet application is still application. In documentation-only work, never invent a missing treatment: record “observed absent; preserve incumbent”, give a concrete advisory proposal and mark its adoption unresolved. Keep all six rows; do not turn the proposal into a builder obligation without redesign authority.

| Technique | Required decision |
|---|---|
| **Anchor typography** | Headline voice, contrasting support, hierarchy, available fonts/fallbacks and required scripts. Check Thai/Latin together when relevant. Contrast can use weight/width within an established family; do not add fonts just to fill slots. |
| **Star of the show** | One dominant element tied to the action/story and its mobile treatment. A workspace's main task area can be the star; do not force marketing heroes into every screen. |
| **Visual rhyming** | A recognisable motif and at least two concrete recurring applications: shape, framing, type detail, colour relationship or motion grammar. |
| **Subtle depth** | A controlled material/layering treatment, location and limits. Even minimal/flat systems can use tonal separation or overlap. Do not force glass, blur or noise; keep depth subordinate to the star. |
| **Text opacity and emphasis** | Primary/supporting/incidental text levels on actual backgrounds. Prefer semantic colour/alpha tokens; verify composited contrast instead of blindly using 100/70/50. Never fade a container holding essential controls. |
| **Design variations** | Materially different compositions/focal treatments using identical content and task; record the winner and reason. Use the bounded process below. |

For a new direction or whole surface, develop two materially different variations within the selected style; add a third only to resolve a real uncertainty. Change composition, focal treatment or interaction, not just colour. Use annotated layouts or visual sketches when useful and tools permit. Text proposals are acceptable for documentation-only work; never call them rendered or user-tested.

For incumbent documentation without redesign permission, compare the existing composition with a scoped alternative on paper and retain the incumbent. Mark alternatives advisory, not approved changes. For a precise small change, retain the settled variation; compare element-level alternatives only if a real design decision remains, without reopening the whole site.

Compare message comprehension, task completion, distinctiveness and feasible delivery. Invite a choice when preference is unresolved; select under delegation when authorised. Record the outcome once and stop exploring when sufficient.

## 5. Write a concrete contract

Read [writing.md](references/writing.md). Adapt [DESIGN.template.md](assets/DESIGN.template.md) and [GUARDRAILS.template.md](assets/GUARDRAILS.template.md); these define structure, not design choices.

Target 600–1,000 prose words for a normal DESIGN.md, allowing more for real complexity. Keep guardrails to at most 12 actionable bullets and about 250 words. Use real paths, semantic tokens, observable behaviours and clear exceptions. Remove placeholders and empty scaffolding.

Use one token authority: map actual code locations and preserve names/values. Label proposed values and their intended destination in a new design. Do not imply proposed components exist or create a conflicting palette in the guardrails.

Use canonical section order: Overview, Colors, Typography, Layout, Elevation & Depth, Shapes, Components, Do's and Don'ts. Put style, evidence, binding style rules and the six-technique index under Overview; scope local composition within Layout. Include only existing or needed components. Map style rules to existing tokens/components or clearly proposed destinations and identify material exceptions.

For motion-led styles, include the relevant motion contract in Layout/Components: purpose, trigger, readable start/end, pacing, interruption/replay and static/reduced-motion equivalent. For asset-led styles, specify crop, asset provenance/availability and fallbacks. Keep the project contract concise; do not paste the entire profile into it.

Keep a short decision note: settled, open, outside scope. Use a separate decision file only for substantial unfinished work needing resumption; ordinary tasks need no tracker or backlog.

## 6. Make builders follow it

Read [review.md](references/review.md) for a review or implementation hand-off.

When creating or updating the design contract in a repo, add/update one bounded `Design Guide` block in the applicable existing AGENTS.md or equivalent. Link the exact two files, require token/component reuse and a UI review gate. Preserve unrelated instructions. If no instruction file exists, create a short project-scoped AGENTS.md. Ordinary UI fixes reuse existing discovery without creating instruction files. Do not duplicate across tools, enable hooks or override repo policy. If contract integration cannot be written, provide the snippet and state that discovery is not wired.

Pass the contract as the explicit brief to Impeccable or another builder. Preserve the selected style and all six techniques. Use specialist execution/audit when available without requiring Impeccable or repeating settled discovery. Coordinate with existing interaction guidance rather than duplicating it.

**Enforcement means agent instructions plus available project checks. Markdown alone cannot automatically constrain all code.** Reuse existing lint, token and visual checks. Add tooling only for a concrete need and within authorised scope.

## 7. Review and finish

For document creation, check paths, selection/provenance, all six concrete decisions, three to five binding style rules, source mappings, guardrail brevity, consistency and unresolved assumptions. Use the selected profile's failure patterns to challenge the proposed rules. Verify the agent pointer when applicable. Do not infer runtime compliance from complete documents.

For UI review, compare changed output with the contract: tokens/components, desktop/mobile, relevant states, keyboard/focus, contrast and reduced motion. Report **rule → evidence → consequence → smallest correction**. Use **pass**, **fail**, or **unverified** per check; missing runtime evidence remains unverified.

Do one batched review. If fixes are authorised, fix within scope and confirm once. Stop and report unresolved findings. Keep intentional system changes in sync, but never rewrite rules to legitimise accidental drift.

For contract work, finish with selected style/reason, files written, builder obligations and meaningful open decisions. For ongoing work, report the requested result, relevant design verification and material remaining risk through the task owner's handoff. For advice, answer directly. Give a next prompt only when a useful handoff remains; do not dump documents or append a second completion report.

## Resources

- [Interview](references/interview.md): missing context/preference.
- [Seven styles](references/styles.md): selection and all six techniques for each style.
- [Shared foundations](references/foundations.md): typography, contrast, controls, responsive layout and motion; separates requirements from heuristics.
- [Neoskeuomorphism](references/style-neoskeuomorphism.md): material, lighting and tactile controls.
- [Kinetic typography](references/style-kinetic-typography.md): readable moving text and localisation.
- [Intentional minimalism](references/style-intentional-minimalism.md): focused hierarchy and recognisable restraint.
- [Editorial design](references/style-editorial.md): reading rhythm, content models and image/type relationships.
- [Story-driven animation](references/style-story-animation.md): meaningful states, pacing and interruption.
- [Human-made design](references/style-human-made.md): authored assets, provenance and controlled irregularity.
- [Expressive design](references/style-expressive.md): bold visual grammar with dependable controls.
- [Writing](references/writing.md): ownership, source mapping and concise outputs.
- [Review](references/review.md): agent wiring and evidence gates.
- [Source patterns](references/source-patterns.md): workflow rationale; read only for questions about its construction.
