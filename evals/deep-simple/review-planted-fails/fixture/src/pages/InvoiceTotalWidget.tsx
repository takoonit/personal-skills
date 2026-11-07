import { useEffect, useState } from 'react'
import { invoiceService } from '../billing/invoiceService'
import type { InvoiceRow } from '../billing/db'

export function InvoiceTotalWidget({ tenantId }: { tenantId: string }) {
  const [total, setTotal] = useState(0)
  useEffect(() => {
    (async () => {
      const all: InvoiceRow[] = []
      let cursor: string | undefined
      do {
        const page = await invoiceService.getInvoicePage(tenantId, cursor)
        all.push(...page.items)
        cursor = page.next
      } while (cursor)
      setTotal(all.reduce((s, r) => s + r.amount_satang, 0) / 100)
    })()
  }, [tenantId])
  return <strong>{total.toFixed(2)} THB</strong>
}
