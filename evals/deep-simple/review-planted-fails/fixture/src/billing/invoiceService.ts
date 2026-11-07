import { getInvoiceById, getInvoicePage } from './invoiceRepo'
import type { InvoiceRow, Page } from './db'

export class InvoiceService {
  async getInvoicePage(tenantId: string, cursor?: string): Promise<Page<InvoiceRow>> {
    try {
      return await getInvoicePage(tenantId, cursor)
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  async getInvoiceById(id: string): Promise<InvoiceRow | null> {
    return getInvoiceById(id)
  }
}
export const invoiceService = new InvoiceService()
