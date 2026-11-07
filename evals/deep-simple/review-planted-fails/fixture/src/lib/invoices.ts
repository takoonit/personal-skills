import { db, InvoiceRow } from '../billing/db'

export type InvoiceId = string & { readonly __brand: 'InvoiceId' }
export type InvoiceStatus = 'draft' | 'awaitingApproval' | 'paid'
export interface Invoice { id: InvoiceId; amountThb: number; status: InvoiceStatus; issuedAt: Date }

const STATUS: Record<string, InvoiceStatus> = { DR: 'draft', PA: 'awaitingApproval', PD: 'paid' }

function toInvoice(r: InvoiceRow): Invoice {
  return { id: r.id as InvoiceId, amountThb: r.amount_satang / 100, status: STATUS[r.status_cd] ?? 'draft', issuedAt: new Date(r.created_at) }
}

/** Every invoice for the tenant in issue order. Handles paging and row mapping. */
export async function* listInvoices(tenantId: string): AsyncIterable<Invoice> {
  let cursor: string | undefined
  do {
    const page = await db.findInvoices(tenantId, cursor)
    yield* page.items.map(toInvoice)
    cursor = page.next
  } while (cursor)
}
