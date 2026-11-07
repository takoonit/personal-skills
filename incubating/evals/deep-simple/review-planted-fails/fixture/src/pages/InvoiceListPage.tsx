import { useEffect, useState } from 'react'
import { invoiceService } from '../billing/invoiceService'
import type { InvoiceRow } from '../billing/db'
import { StatusPanel } from '../ui/StatusPanel'

export function InvoiceListPage({ tenantId }: { tenantId: string }) {
  const [rows, setRows] = useState<InvoiceRow[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    (async () => {
      const all: InvoiceRow[] = []
      let cursor: string | undefined
      do {
        const page = await invoiceService.getInvoicePage(tenantId, cursor)
        all.push(...page.items)
        cursor = page.next
      } while (cursor)
      setRows(all)
      setLoading(false)
    })()
  }, [tenantId])
  return (
    <StatusPanel isLoading={loading} isError={false} isEmpty={rows.length === 0} errorMessage="">
      <ul>{rows.map(r => <li key={r.id}>{r.id} {r.status_cd}</li>)}</ul>
    </StatusPanel>
  )
}
