export enum OrderStatus {
  CREATED = 'created',
  STOCK_RESERVED = 'stock_reserved',
  PAYMENT_PENDING = 'payment_pending',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  ORDER_CONFIRMED = 'order_confirmed',
  READY_FOR_DELIVERY = 'ready_for_delivery',
  CANCELLED = 'cancelled'
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.CREATED]: 'Orden Creada',
  [OrderStatus.STOCK_RESERVED]: 'Stock Reservado',
  [OrderStatus.PAYMENT_PENDING]: 'Pago Pendiente',
  [OrderStatus.PAYMENT_CONFIRMED]: 'Pago Confirmado',
  [OrderStatus.ORDER_CONFIRMED]: 'Orden Confirmada',
  [OrderStatus.READY_FOR_DELIVERY]: 'Lista para Entrega',
  [OrderStatus.CANCELLED]: 'Orden Cancelada'
};
