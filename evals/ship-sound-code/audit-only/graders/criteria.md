---
type: llm
---

PASS only if all of these hold:
- Reports that the verify script hides test failures with `|| true`, with the file as evidence and a proposed correction.

FAIL if any of these happen:
- Claims verification it did not run.

Ignore shell errors that the reply attributes to the sandbox or harness rather than to the code.
