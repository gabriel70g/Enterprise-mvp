import { OrderStatus, ORDER_STATUS_LABELS } from './order.status';

export class OrderStateManager {
  private currentStatus: OrderStatus;
  private statusHistory: Array<{ status: OrderStatus; timestamp: Date; reason?: string }> = [];

  constructor(initialStatus: OrderStatus = OrderStatus.CREATED) {
    this.currentStatus = initialStatus;
    this.addStatusToHistory(initialStatus);
  }

  getCurrentStatus(): OrderStatus {
    return this.currentStatus;
  }

  getStatusLabel(): string {
    return ORDER_STATUS_LABELS[this.currentStatus];
  }

  getStatusHistory(): Array<{ status: OrderStatus; timestamp: Date; reason?: string }> {
    return [...this.statusHistory];
  }

  canTransitionTo(newStatus: OrderStatus): boolean {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.CREATED]: [OrderStatus.STOCK_RESERVED, OrderStatus.CANCELLED],
      [OrderStatus.STOCK_RESERVED]: [OrderStatus.PAYMENT_PENDING, OrderStatus.CANCELLED],
      [OrderStatus.PAYMENT_PENDING]: [OrderStatus.PAYMENT_CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.PAYMENT_CONFIRMED]: [OrderStatus.ORDER_CONFIRMED],
      [OrderStatus.ORDER_CONFIRMED]: [OrderStatus.READY_FOR_DELIVERY],
      [OrderStatus.READY_FOR_DELIVERY]: [OrderStatus.CANCELLED], // Solo cancelación después de listo
      [OrderStatus.CANCELLED]: [] // Estado final
    };

    return validTransitions[this.currentStatus]?.includes(newStatus) || false;
  }

  transitionTo(newStatus: OrderStatus, reason?: string): boolean {
    if (!this.canTransitionTo(newStatus)) {
      console.warn(`Invalid transition from ${this.currentStatus} to ${newStatus}`);
      return false;
    }

    this.currentStatus = newStatus;
    this.addStatusToHistory(newStatus, reason);
    console.log(`✅ Order status changed to: ${ORDER_STATUS_LABELS[newStatus]}`);
    return true;
  }

  private addStatusToHistory(status: OrderStatus, reason?: string): void {
    this.statusHistory.push({
      status,
      timestamp: new Date(),
      reason
    });
  }

  isCompleted(): boolean {
    return this.currentStatus === OrderStatus.READY_FOR_DELIVERY;
  }

  isCancelled(): boolean {
    return this.currentStatus === OrderStatus.CANCELLED;
  }

  canBeCancelled(): boolean {
    return this.currentStatus !== OrderStatus.READY_FOR_DELIVERY && 
           this.currentStatus !== OrderStatus.CANCELLED;
  }
}
