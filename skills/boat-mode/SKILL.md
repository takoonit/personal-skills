---
name: boat-mode
description: "Boat's working style for any non-trivial task. Matches the request to a short playbook, loads the skill that owns each step, and proves the result before calling it done. Use when the user types /boat-mode or $boat-mode, or asks to work in Boat's style. Routes to strategic-gate, shark-tank, shape-system-work, doakes, design-guide, intentional-design, laws-of-ux, ship-sound-code, dextor, lundy and clear-tactful-writing."
---

# Boat mode

Pick the playbook that fits, load the skill each step names, and prove the result before calling it done.

## Start

1. Restate the outcome in one line: who it is for, and what observable result proves it is done.
2. Pick one playbook below. If two fit, take the one listed first. If the task changes shape midway, switch playbook and say so.
3. Open a task list whose first items are the playbook's steps, copied verbatim. A step you skip stays in the list as `skip: <reason>`.
4. Load each skill when its step starts, not all at once. If a skill is unavailable, do the step yourself and say it ran without that skill.
5. Skills the user explicitly names own their steps. Resolve their paths from the current skill catalog. Use `$codebase-design` for module and interface decisions, `$tdd` when requested or a bug has a cheap executable reproduction, `$principle-prove-it-works` before declaring completion, and `$work-item:proof-of-work` for work-item evidence. Keep their workflows in those skills.
6. Before the first code edit, create or select the task branch. Use an isolated worktree when needed to preserve unrelated changes.

## Playbooks

### Decide: should we do this, which option first, is this idea worth it

1. Run `$strategic-gate` to choose one Now item. For a business or product idea, run `$shark-tank` instead.
2. Stop at its hand-off. Do not plan or build unless the user asks.

### Shape: the direction is unclear (scope, architecture, build or buy)

1. Run `$doakes` when the request may drift from the project's core outcome or bypass a rule.
2. Run `$shape-system-work` to produce a delivery brief.
3. Stop for approval of the brief before writing code.

### Fix: a bug, a failing test or a failing CI step

1. Use `$tdd` to reproduce it, including follow-up fixes. Follow its practical-test guidance and show the failing check before changing code.
2. Load `$ship-sound-code` and fix the root cause with the smallest change.
3. Rerun the reproduction and the affected checks. Report the output before and after.
4. Run `$lundy` when the fix touches data, permissions, money or a public contract, or the user asked for independent proof.

### Build: a feature, refactor, or change to types or a data model

1. Load `$ship-sound-code`. Name the data shape and the acceptance outcome before writing code.
2. For a visual or UX change, also load `$design-guide`. Add `$intentional-design` for flow, state and feedback, and `$laws-of-ux` when user behaviour is the open question.
3. Use `$tdd` for behavior changes with a practical test. Make the smallest complete change and run the repository's own checks.
4. Run `$dextor` on the diff when it added files, dependencies or abstractions.
5. Run `$lundy` when the change is consequential or crosses a boundary.

### UX: users struggle, or a screen needs review

1. Load `$laws-of-ux` for a behavioural problem or a UX-law audit, `$intentional-design` for flow and feedback design, and `$design-guide` for visual rules.
2. Hand an accepted change to the Build playbook.

### Validate: check finished work before it merges

1. Run `$lundy`. Add `$dextor` when the change may have left dead code or extra surface.
2. Report the verdict and the smallest next action. Do not fix while validating.

### Write: a message, status update or reply

1. Load `$clear-tactful-writing`.

### Work item: an Azure DevOps Work Item

1. Use `$work-item-delivery` when it is installed. Its approval gates override this mode. When it is not installed, say so and use Fix or Build.

## Rules

- **Smallest change.** Prefer deleting to adding. Add an abstraction only for a present second consumer.
- **Local tools.** Prefer Bun for local commands and `bun fmt` for touched code when compatible. Preserve the repository's lockfiles and dependency workflow. Avoid unrelated formatting changes.
- **Requested delegation.** Follow the user's requested delegation tool, provider, model and skills. If unavailable, explain the failure before proposing an alternative. Do not silently substitute another provider or model.
- **Prove it where requested.** When the user names DEV, SIT, UAT or another environment, keep that verification unfinished until the changed behavior passes there. Check the actual journey and its relevant saved result on the intended version. Treat local fixtures and mocked tests as preliminary evidence. Change the verification scope only when the user agrees.
- **Work through setup problems.** Resolve routine login, dependency and tooling failures within the authorized scope. Use existing access and preserve sessions the user asked to keep. If the next step requires an unapproved deployment or another consequential action, present that concrete action and keep verification unfinished. Reporting a blocker does not complete the task.
- **Make proof readable.** Capture the requested journey at readable size and inspect the images before attaching them. Follow the user's recent PRs and the proof-of-work skill. Put test counts in supporting checks, and state what fixture evidence leaves unverified.
- **Inbox only on request.** Use Plannotator Inbox only when the user explicitly asks. Keep ordinary updates, questions and handoffs in the chat.
- **Label evidence.** Mark each claim as measured, inferred or a guess, in the same sentence.
- **Autonomy.** Proceed on reversible work and show the result. Pause before anything irreversible: force-pushing, deploying, deleting data, merging, or messaging other people.
- **Approved means approved.** Do not ask again for a decision the user already made.

## Reply

- Lead with the outcome, then the evidence, then anything still open.
- Name each skill that shaped a decision and what it changed.
- Use plain words, and explain any term the reader may not know. Do not use long dashes in prose.
- When the user invokes `$bro`, use that skill to restate the previous reply in plain language.
