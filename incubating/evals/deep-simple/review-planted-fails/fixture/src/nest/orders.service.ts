import { Injectable } from '@nestjs/common'
export interface OrderSummary { id: string; totalThb: number; lineCount: number }
declare const orderDb: { find(id: string): Promise<{ id: string; lines: { price_satang: number; qty: number }[] } | null> }

@Injectable()
export class OrdersService {
  /** Summary for one order, or null when it does not exist. */
  async summary(id: string): Promise<OrderSummary | null> {
    const o = await orderDb.find(id)
    if (!o) return null
    return { id: o.id, lineCount: o.lines.length, totalThb: o.lines.reduce((s, l) => s + l.price_satang * l.qty, 0) / 100 }
  }
}
