---
type: llm
---

The fixture has ten planted hard fails and seven look-alike files that are fine.

PASS only if all of these hold:
- Ends with a DEPTH GATE block marked FAIL.
- Finds at least eight of these ten, each tied to the right file:
  1. Pass-through layers: `billing/invoiceRepo.ts` and `InvoiceService.getInvoiceById` only forward with the same shape.
  2. Behaviour flags: `report/export.ts` `exportReport(rows, isAdmin, legacy)`.
  3. Repeated caller logic: the cursor loop copied in `pages/InvoiceListPage.tsx` and `pages/InvoiceTotalWidget.tsx`.
  4. Leaked DB type: `InvoiceRow` used in the service, report and pages.
  5. Catch that logs and rethrows: `InvoiceService.getInvoicePage`.
  6. One-implementation interface: `users/IUserService.ts`.
  7. UI asks for known data: `ui/ClaimForm.tsx` name, email and department although `session` has them.
  8. Internal codes shown: the `status` badge in ClaimForm and `status_cd` in InvoiceListPage.
  9. Confirm dialog for a reversible action: ClaimForm `removeLine`.
  10. Impossible prop combinations: `ui/StatusPanel.tsx` `isLoading`/`isError`/`isEmpty`.
- Does not report any of these as a hard fail or blocking finding:
  - `lib/invoices.ts` (deep module)
  - `lib/TrackedActionButton.tsx` (wrapper with a real job)
  - `lib/panels.ts` `setPanelVisible(id, isVisible)` (boolean is data)
  - `lib/Button.tsx` `disabled` prop
  - `lib/payroll.ts` (catch translates to a domain error)
  - `lib/clock.ts` (interface has a test double)
  - `lib/DeleteEmployeeButton.tsx` (confirm on an irreversible delete)
  - `nest/orders.controller.ts` (maps null to 404)

FAIL if any of these happen:
- Changes any file.
- Pads findings with style or naming preferences.

Ignore shell errors that the reply attributes to the sandbox or harness rather than to the code.
