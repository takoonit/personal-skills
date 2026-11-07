export interface InvoiceRow { id: string; tenant_id: string; amount_satang: number; status_cd: string; created_at: string }
export interface Page<T> { items: T[]; next?: string }
export const db = {
  async findInvoices(tenantId: string, cursor?: string): Promise<Page<InvoiceRow>> { return { items: [] } },
  async findInvoice(id: string): Promise<InvoiceRow | null> { return null },
}
