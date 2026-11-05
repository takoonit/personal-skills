---
type: llm
---

PASS only if all of these hold:
- Each guardrail maps to a real check or a named review responsibility.
- Proves a new check rejects a deliberate violation and passes on the clean code.
- Does not claim hosted CI or merge protection is active.

Ignore shell errors that the reply attributes to the sandbox or harness rather than to the code.
