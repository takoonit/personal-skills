---
name: deep-simple-setup
description: "Install the deep-simple rule (deepen modules, simplify interfaces) into a repository so every AI agent and PR applies it: an AGENTS.md block, CLAUDE.md import, PR checklist, and optional tested ESLint and knip guardrails. Use when the user asks to set up, install, enforce or uninstall deep-simple in a repo. Not for general coding standards or CI gates (ship-sound-code), or for reviewing code (deep-simple)."
---

# Deep and Simple: Setup

Installs the core rule **deepen modules and simplify interfaces** into a repository so agents apply it on every task and PRs check it. Pairs with the `deep-simple` skill, which holds the full rules and gate.

## Rules for this setup

- Idempotent. Inserted content sits between `deep-simple:start` and `deep-simple:end` markers. Re-running replaces only that block; content outside it is never changed or reordered.
- Show the planned file list and diff before writing. Ask before adding any npm dependency.
- Do not commit unless asked.

## Steps

### 1. Detect

- Repo root: `git rev-parse --show-toplevel`.
- Stack: `package.json`, `tsconfig.json`, framework (Next.js, NestJS, React).
- Agent files: `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`, `.github/copilot-instructions.md`.
- PR host: `git remote get-url origin` (`dev.azure.com` or `visualstudio.com` = Azure DevOps; `github.com` = GitHub).
- Lint: `eslint.config.*` or `.eslintrc*`, `typescript-eslint` version, `knip`.

Report findings in a short list.

### 2. Install the rule block

Upsert this exact block into `AGENTS.md` (create the file if missing):

```md
<!-- deep-simple:start -->
## Core rule: deepen modules and simplify interfaces

Applies to all code, components, and UI. A module is any boundary (function, hook, class, file, service, component, screen). Its caller is code, a developer, or a user. Interface = everything the caller must know, decide, provide, or recover from. Every change must keep depth equal or higher.

Before implementing: reuse an existing deep module if one exists, then write the ideal call site, JSX, or user flow and implement to it. If the interface wants to grow, redesign it instead of adding a param or flag.

Hard fails (fix before calling work done):
1. Pass-through function, wrapper, or component with the same inputs and outputs (a real job such as permission, tracking, or mapping is fine).
2. Boolean or mode param/prop that makes the body branch into different work (stored or rendered booleans like `disabled` are fine).
3. Logic repeated in 2+ callers that the callee could own.
4. Vendor, ORM, DB row, or raw API types outside their owning adapter.
5. catch that only logs and rethrows, or is empty.
6. Interface or abstract class with one implementation and no test double.
7. UI asking for data the app already has.
8. Internal keys, enums, or status codes shown to users (user-facing numbers like invoice no. are fine).
9. Confirm dialog for a reversible action, or a step with no decision.
10. Props or state that allow impossible combinations (use one status union).

Also: smallest surface, defaults for the common case, one primary action per screen, prevent errors instead of reporting them, no speculative generality.

Exceptions only for mandated conventions, frozen public APIs, compliance steps, or accessibility. Mark them: `// deep-simple-exception: <rule> <reason>`.

End every coding task with a DEPTH GATE: PASS/FAIL, the interface, what it hides, and the surface delta. Use the `deep-simple` skill when available.
<!-- deep-simple:end -->
```

Then point other agents at it:

- **CLAUDE.md**: if missing, create it containing `@AGENTS.md`. If present and it does not already import AGENTS.md, append a marker block containing `@AGENTS.md` on its own line.
- **Cursor / Copilot**: recent versions also read `AGENTS.md`. Only write `.cursor/rules/deep-simple.mdc` (frontmatter `alwaysApply: true`, same body) or a block in `.github/copilot-instructions.md` if the repo already uses those files or the user asks. Duplicates cost context on every task.

### 3. PR checklist

Upsert into the template for the detected host (`.azuredevops/pull_request_template.md` or `.github/pull_request_template.md`):

```md
<!-- deep-simple:start -->
### Depth gate
- [ ] No pass-through layers or behaviour flags added
- [ ] Callers and users do less work than before (no repeated logic, no asking for known data)
- [ ] No internal/vendor types or codes cross a boundary or reach the UI
- [ ] Exports/props/fields did not grow without need
- [ ] Exceptions marked with `deep-simple-exception` and explained here
<!-- deep-simple:end -->
```

### 4. Mechanical guardrails (ask first)

These catch part of the rule automatically (tested: HF2, HF5, HF10, plus empty catches). Data booleans will also show up as HF2 warnings; that is why they are `warn`. The gate catches the rest.

Merge into the existing flat config (do not replace it). `switch-exhaustiveness-check` needs typed linting, so `projectService` is required or ESLint crashes:

```js
// eslint.config.mjs (merge this object into the existing array)
import tseslint from 'typescript-eslint'

export const deepSimple = {
  files: ['src/**/*.{ts,tsx}'],
  ignores: ['**/*.d.ts'],
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
  },
  plugins: { '@typescript-eslint': tseslint.plugin },
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/switch-exhaustiveness-check': 'error',
    'no-empty': ['error', { allowEmptyCatch: false }],
    'no-restricted-syntax': ['warn',
      { selector: 'CatchClause > BlockStatement > ThrowStatement[argument.type="Identifier"]',
        message: 'deep-simple HF5: catch that only rethrows. Remove it or translate to a domain error.' },
      { selector: ':function > Identifier[typeAnnotation.typeAnnotation.type="TSBooleanKeyword"]',
        message: 'deep-simple HF2: boolean param. If the body branches on it, split the function or decide internally.' },
      { selector: 'TSPropertySignature[key.name=/^is(Loading|Error|Empty|Success|Fetching)$/]',
        message: 'deep-simple HF10: status booleans. Use one status union.' },
    ],
  },
}
```

If the repo already has `no-restricted-syntax` entries, append these selectors to its list; a second definition would override the first.

Unused exports (R7): offer `knip`. It needs entry points or it reports nearly everything as unused. Let its framework plugins (Next.js, NestJS, Vite) detect entries, add any missing ones in `knip.json` (pages, controllers, tests), and review the first report with the user before enforcing it. Add a `lint:surface` script.

If the existing codebase produces many hits, keep new rules at `warn`, report the current count, and suggest enforcing on changed files only.

### 5. Verify and report

- Re-run the upsert; every file must be byte-identical to the first run, and each marker block must appear exactly once.
- Confirm the original content outside markers is still present.
- If guardrails were added: run `npx eslint <src>` and `npx tsc --noEmit`; report hit counts by rule.
- Report the files created or changed, guardrails added or skipped, and how to re-run.

## Uninstall

Remove every `deep-simple:start` to `deep-simple:end` block, `.cursor/rules/deep-simple.mdc` if this skill created it, and the lint rules and `knip` setup this skill added. Leave everything else untouched.
