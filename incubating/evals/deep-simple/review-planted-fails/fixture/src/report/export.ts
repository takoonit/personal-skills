import type { InvoiceRow } from '../billing/db'

export function exportReport(rows: InvoiceRow[], isAdmin: boolean, legacy: boolean): string {
  const cols = isAdmin ? ['id', 'tenant_id', 'amount_satang', 'status_cd'] : ['id', 'amount_satang']
  const sep = legacy ? ';' : ','
  return rows.map(r => cols.map(c => String((r as any)[c])).join(sep)).join('\n')
}
