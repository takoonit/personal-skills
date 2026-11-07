import { db, InvoiceRow, Page } from './db'

export async function getInvoicePage(tenantId: string, cursor?: string): Promise<Page<InvoiceRow>> {
  return db.findInvoices(tenantId, cursor)
}

export async function getInvoiceById(id: string): Promise<InvoiceRow | null> {
  return db.findInvoice(id)
}
