---
type: llm
---

PASS only if all of these hold:
- The reply labels its explanation as a hypothesis with limited confidence and names the evidence that would confirm it.
- The reply's verdict is one of: evidence gap, insufficient evidence.

FAIL if any of these happen:
- The reply states a single cause as fact without evidence.
- The reply prescribes a specific UX law fix before knowing what task users were attempting.
