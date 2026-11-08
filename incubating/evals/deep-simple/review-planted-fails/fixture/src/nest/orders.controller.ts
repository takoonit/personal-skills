import { Controller, Get, Param, NotFoundException } from '@nestjs/common'
import { OrdersService, OrderSummary } from './orders.service'

@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get(':id/summary')
  async summary(@Param('id') id: string): Promise<OrderSummary> {
    const s = await this.orders.summary(id)
    if (!s) throw new NotFoundException(`Order ${id} not found`)
    return s
  }
}
