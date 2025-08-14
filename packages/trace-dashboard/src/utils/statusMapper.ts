// Mapeo de estados de traza a estados de orden
export const mapTraceStatusToOrderStatus = (traceStatus: string, service: string, action: string): string => {
  // Estados específicos por servicio y acción
  if (service === 'inventory-service' && action === 'Request') {
    return 'stock_reserved';
  }
  
  if (service === 'payment-service' && action === 'Request') {
    return 'payment_pending';
  }
  
  if (service === 'payment-service' && action === 'Response') {
    return 'payment_confirmed';
  }
  
  if (service === 'order-service' && action === 'Response') {
    return 'order_confirmed';
  }
  
  if (service === 'inventory-service' && action === 'Response') {
    return 'ready_for_delivery';
  }
  
  // Estados por status de traza
  switch (traceStatus) {
    case 'pending':
      return 'created';
    case 'completed':
      return 'order_confirmed';
    case 'failed':
      return 'cancelled';
    default:
      return 'created';
  }
};

// Mapeo inverso para mostrar labels correctos
export const getOrderStatusLabel = (orderStatus: string): string => {
  const statusLabels: Record<string, string> = {
    'created': 'Orden Creada',
    'stock_reserved': 'Stock Reservado',
    'payment_pending': 'Pago Pendiente',
    'payment_confirmed': 'Pago Confirmado',
    'order_confirmed': 'Orden Confirmada',
    'ready_for_delivery': 'Lista para Entrega',
    'cancelled': 'Orden Cancelada'
  };
  
  return statusLabels[orderStatus] || 'Estado Desconocido';
};
