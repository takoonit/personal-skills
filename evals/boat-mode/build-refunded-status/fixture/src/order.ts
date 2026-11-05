export type Order =
  | { kind: 'pending'; id: string }
  | { kind: 'paid'; id: string; paidAt: string };

export function describeOrder(order: Order): string {
  switch (order.kind) {
    case 'pending':
      return `Order ${order.id} is waiting for payment`;
    case 'paid':
      return `Order ${order.id} was paid at ${order.paidAt}`;
    default:
      throw new Error('unknown order');
  }
}
