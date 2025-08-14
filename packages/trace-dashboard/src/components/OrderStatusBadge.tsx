import React from 'react';

export interface OrderStatusInfo {
  status: string;
  label: string;
  color: string;
  icon: string;
}

interface OrderStatusBadgeProps {
  status: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const ORDER_STATUS_CONFIG: Record<string, OrderStatusInfo> = {
  'created': {
    status: 'created',
    label: 'Orden Creada',
    color: 'bg-blue-500',
    icon: '📝'
  },
  'stock_reserved': {
    status: 'stock_reserved',
    label: 'Stock Reservado',
    color: 'bg-yellow-500',
    icon: '📦'
  },
  'payment_pending': {
    status: 'payment_pending',
    label: 'Pago Pendiente',
    color: 'bg-orange-500',
    icon: '⏳'
  },
  'payment_confirmed': {
    status: 'payment_confirmed',
    label: 'Pago Confirmado',
    color: 'bg-purple-500',
    icon: '💳'
  },
  'order_confirmed': {
    status: 'order_confirmed',
    label: 'Orden Confirmada',
    color: 'bg-green-500',
    icon: '✅'
  },
  'ready_for_delivery': {
    status: 'ready_for_delivery',
    label: 'Lista para Entrega',
    color: 'bg-emerald-500',
    icon: '🚚'
  },
  'cancelled': {
    status: 'cancelled',
    label: 'Orden Cancelada',
    color: 'bg-red-500',
    icon: '❌'
  }
};

const SIZE_CLASSES = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base'
};

const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ 
  status, 
  showIcon = true, 
  size = 'md' 
}) => {
  const statusInfo = ORDER_STATUS_CONFIG[status] || {
    status: 'unknown',
    label: 'Estado Desconocido',
    color: 'bg-gray-500',
    icon: '❓'
  };

  return (
    <span 
      data-testid="order-status-badge"
      className={`
      ${statusInfo.color} 
      ${SIZE_CLASSES[size]}
      text-white 
      font-medium 
      rounded-full 
      inline-flex 
      items-center 
      gap-2
      shadow-sm
      transition-all 
      duration-200 
      hover:scale-105
    `}>
      {showIcon && <span className="text-sm">{statusInfo.icon}</span>}
      <span>{statusInfo.label}</span>
    </span>
  );
};

export default OrderStatusBadge;
