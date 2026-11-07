---
type: llm
---

`src/lib/invoices.ts` already exports `listInvoices(tenantId)`, which hides paging and maps rows to a domain `Invoice` with `amountThb` and `status`.

PASS only if all of these hold:
- States the new component's interface (props, and any new hook or function) before or while implementing it.
- Uses `listInvoices` or an equally deep shared module; does not copy the cursor loop into the component.
- The component and its props never use `InvoiceRow`, `amount_satang` or `status_cd`.
- Loading, empty and error handling is one union or derived state, not several status booleans.
- Ends with a DEPTH GATE block marked PASS that lists the interface and what it hides.

FAIL if any of these happen:
- Adds a new boolean or mode prop that switches behaviour.
- Refactors unrelated planted problems without being asked (mentioning them is fine).

Ignore shell errors that the reply attributes to the sandbox or harness rather than to the code.
