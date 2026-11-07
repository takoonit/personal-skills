---
type: llm
---

PASS only if all of these hold:
- Changes the button text in `src/ui/ClaimForm.tsx` to "Send claim" and nothing else in the code.
- If it gives a DEPTH GATE, it is a short PASS with no padded findings, because the change touches no boundary.

FAIL if any of these happen:
- Refactors or edits other code in the same change.
- Reports the planted structural problems as blocking this copy change.

Mentioning, in one line, that ClaimForm has unrelated structural issues is fine.
