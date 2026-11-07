---
name: deep-simple
description: "Structure gate for TypeScript code and UI: deepen modules and simplify interfaces. Use when writing, changing, reviewing or refactoring modules, APIs, components or screens, alongside ship-sound-code, and before calling that work done. Blocks completion on hard fails such as pass-through layers, behaviour flags, leaked vendor types, status-boolean props, or UI that asks for data the app already has. Not for dead-code or dependency bloat hunts (dextor), visual direction (design-guide), or deciding what to build (shape-system-work)."
---

# Deep and Simple

**Core rule: deepen modules and simplify interfaces.**

This skill is strict. Its rules are requirements, not suggestions. Work that fails the gate is not done.

It owns structure and simplicity only. `ship-sound-code` still owns the change and its verification; this skill is the gate that change must pass.

## Definitions

A **module** is anything with a boundary: function, hook, class, file, package, service, component, screen, flow.
Its **caller** is whoever uses it: other code, a developer using a component, or a person using a screen.

- **Interface** = everything the caller must know, decide, provide, or recover from.
  - Code: params, options, generics, return shape, thrown errors, call order, setup, side effects, exports.
  - Components: props, required wiring, states the parent must handle.
  - UI: fields, choices, steps, settings, modes, jargon, error states, things to remember.
- **Depth** = work the module does for the caller, divided by interface cost.
- **Owning module** (for a vendor, ORM, DB, or external API) = the one adapter file or folder that talks to it. Everything outside the adapter uses domain types.

Every change must keep depth the same or increase it. Never make the caller do the module's work.

## The 10 rules

| ID | Rule | Code / components | UI / UX |
|---|---|---|---|
| R1 | Design from the caller | Write the ideal call site or JSX first, then implement to it | Write the user's job in one sentence; every element serves it |
| R2 | Pull complexity down | Callers never repeat setup, checks, mapping, retries, pagination, loading/empty/error handling | Never ask for what the system knows or can derive; prefill |
| R3 | Define errors out of existence | Idempotent ops, empty in -> empty out, no catch-log-rethrow, throw only what callers can act on | Constrain and normalize input, undo instead of "Are you sure?", inline errors with the fix |
| R4 | No pass-through layers | No wrapper, service, mapper, or component that only forwards the same shape | No screen, step, or dialog without a real decision |
| R5 | No modes | No boolean or mode params/props that switch behaviour: split or decide internally | No hidden modes where the same control does different things |
| R6 | One owner per decision | Vendor, ORM, DTO, and internal types stay inside their owning module; map once | No internal keys, enums, or status codes shown; one place maps system terms to user terms |
| R7 | Smallest surface | Fewest exports, params, props; no single-use exported helpers | Fewest fields, buttons, settings; one primary action per screen |
| R8 | Defaults for the common case | Common call needs zero options | Common path needs zero changes to defaults |
| R9 | Make misuse impossible | Unions over optional-field soup, one `status` over boolean prop sets, branded IDs, parse at the boundary | Disable or hide what is invalid now, with the reason visible |
| R10 | No speculative generality | No one-impl interface, unused generic, plugin hook, or abstract base with one child | No options or settings for needs nobody has today |

## Hard fails (block completion)

Any of these in new or changed code fails the gate unless an exception is recorded. Each has a test so the call is not a matter of taste.

| HF | Fails when | Does NOT fail when |
|---|---|---|
| 1 | A function, method, or component only forwards to another with the same inputs and outputs (R4) | It adds a real job: permission check, tracking, mapping to a different shape, turning null into a 404, caching |
| 2 | A boolean or mode param/prop makes the body branch into different work (R5) | The boolean is data that is stored, passed through, or rendered as state: `setVisible(id, visible)`, `disabled`, `open`, `checked` |
| 3 | The same logic (loop, mapping, check, state handling) appears in 2+ callers and the callee could own it (R2) | The callers genuinely need different behaviour |
| 4 | A vendor, ORM, DB row, or raw API type appears in a signature, props, or import outside its owning module (R6) | It is used only inside the owning adapter |
| 5 | A `catch` only logs and rethrows the same error, or is empty (R3) | It translates to a domain error, retries, recovers, or adds context the caller can act on |
| 6 | An interface or abstract class has exactly one implementation, including `const x: X = {...}` object literals (R10) | A test or fake in the repo supplies another implementation |
| 7 | UI asks the user for data the app already has (R2) | The user must confirm or override it, and it is prefilled |
| 8 | UI shows internal keys, UUIDs, enum values, or status codes (R6) | It is a user-facing identifier people use: invoice number, employee code, order number |
| 9 | A confirm dialog guards a reversible action, or a step/screen has no decision (R3, R4) | The action is irreversible or destructive (permanent delete, payment, sending) |
| 10 | Props or state allow impossible combinations, such as `isLoading` + `isError` + `isEmpty` (R9) | A single union or derived state is used |

## Protocol

### Mode A: writing or changing

1. **Reuse before you create.** Search for an existing module that already hides this complexity (`grep -rn` for the domain noun). Extend or use it rather than adding a parallel one.
2. **Declare the interface first.** Before implementing, write in 1 to 5 lines the signature, props, or user flow, and what is hidden behind it. Example:
   `useInvoices(tenantId): LoadState<Invoice[]>` hides paging, row mapping, loading and error state.
3. **Implement to that interface.** If implementation pressure pushes the interface to grow, stop and redesign it; do not just add a param or flag.
4. **Run the gate** on every new or changed export, component, and screen.
5. **Fix all hard fails** before reporting done.

A change that touches no boundary (copy text, a constant, a style value) gets a one-line PASS gate. Do not invent findings.

### Mode B: reviewing

1. **Scope:**
   - Branch or PR: `git diff <base>...HEAD`.
   - Uncommitted: `git diff` plus `git diff --staged`.
   - No commits yet, or the user names paths or asks for an audit: review those paths, or all of `src/`.
   Always include direct callers and callees of changed modules.
2. **Candidate scans** (they find candidates; decide each one with the hard-fail table):
   ```bash
   grep -rnE "\b\w+\??:\s*boolean" <paths>                  # HF2, HF10
   grep -rnA3 "catch" <paths> | grep -E "throw|console"      # HF5
   grep -rnE "implements |: [A-Z]\w+ = \{" <paths>            # HF6
   grep -rnE "^export (interface|type) \w+(Row|Dto|DTO|Entity|Response)" <paths>  # HF4
   grep -rnE "\{\w+\.(status|state|type|code)\w*\}" --include=*.tsx <paths>  # HF8
   ```
   If the repo has the deep-simple ESLint rules (from `deep-simple-setup`), run lint too.
3. Read each boundary and check the hard fails, then the 10 rules.
4. Report with the gate output. Do not edit unless asked.

### Mode C: refactoring

1. Lock behaviour: run existing tests; add characterization tests at the boundary you keep if coverage is thin.
2. One finding per step: design the new interface from the call sites, move complexity inside, migrate callers, delete the old path in the same step.
3. Verify each step: `tsc --noEmit`, tests, lint at or above baseline.
4. No behaviour or feature changes mixed in. Report bugs you find; do not fix them in the refactor.

## Gate output (required)

End every write, review, or refactor with:

```
DEPTH GATE: PASS | FAIL
Interface: <new or changed signatures / props / flow, short>
Hidden: <what callers no longer handle>
Delta: exports +a/-b, params +c/-d, props +e/-f, UI steps/inputs/decisions before -> after
       (review mode: projected delta if all findings are fixed)
Findings:
| # | Sev | HF/Rule | Location | Problem | Fix |
Exceptions: <none | list with reason>
```

Severity:
- **Block** = any hard fail. Always Block, whatever rule it maps to.
- For findings that are not hard fails: **High** if the cost grows with each new caller (R2, R6), **Medium** for R3, R4, R5, R7, R8, **Low** for R9, R10 polish.

The gate is FAIL while any Block remains. Do not say the task is complete on FAIL.

## Exceptions

A rule may be broken only for one of these reasons, and the gate must list it:

- A mandated repo or framework convention (for example a required NestJS controller/service/repository split). Keep each layer as deep as the convention allows.
- A published or cross-team API that cannot change now. Deepen behind it.
- A business, legal, or compliance step (required approval, legal confirmation). Keep it as light as the rule allows.
- Accessibility. Never remove labels, focus states, or error text to look simpler.

In code, mark the spot: `// deep-simple-exception: R5 <reason>`.

## Hand-offs

- `ship-sound-code` owns the change, its tests and verification; run this gate inside that flow.
- `dextor` owns dead code, unused dependencies and configuration bloat. Hand those over instead of reporting them here.
- `design-guide`, `intentional-design` and `laws-of-ux` own visual direction, interaction design and behavioural UX. This gate checks only what the user must know, decide, provide, or recover from.
- `shape-system-work` owns open architecture or product choices. If the simpler interface depends on one, stop and route there.
- Other review skills can merge the findings table; keep the HF/Rule column.
