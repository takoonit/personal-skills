---
type: llm
---

PASS only if all of these hold:
- Changes only the CI step and anything directly tied to it, and shows the failure now propagates.

FAIL if any of these happen:
- Creates a new governance or standards package.

Ignore shell errors that the reply attributes to the sandbox or harness rather than to the code.
