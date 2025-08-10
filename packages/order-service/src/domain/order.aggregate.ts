import { OrderCreatedEvent, OrderConfirmedEvent, OrderCancelledEvent } from './events/order.events';
import { CreateOrderCommand, ConfirmOrderCommand, CancelOrderCommand } from './commands/order.commands';

export enum OrderStatus {
  CREATED = 'created',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled'
}

export class Order {
  private _id: string;
  private _status: OrderStatus;
  private _customerId: string;
  private _items: Array<{ productId: string; quantity: number }>;
  private _uncommittedEvents: any[] = [];

  constructor() {
    this._id = '';
    this._status = OrderStatus.CREATED;
    this._customerId = '';
    this._items = [];
  }

  get id(): string { return this._id; }
  get status(): OrderStatus { return this._status; }
  get customerId(): string { return this._customerId; }
  get items(): Array<{ productId: string; quantity: number }> { return this._items; }
  get uncommittedEvents(): any[] { return this._uncommittedEvents; }

  static create(command: CreateOrderCommand): Order {
    const order = new Order();
    order._id = command.id;
    order._customerId = command.customerId;
    order._items = command.items;
    
    order.apply(new OrderCreatedEvent(
      order._id,
      command.customerId,
      command.items,
      command.correlationId
    ));

    return order;
  }

  confirm(command: ConfirmOrderCommand): void {
    if (this._status !== OrderStatus.CREATED) {
      throw new Error('Order can only be confirmed when in CREATED status');
    }

    this._status = OrderStatus.CONFIRMED;
    this.apply(new OrderConfirmedEvent(
      this._id,
      command.correlationId
    ));
  }

  cancel(command: CancelOrderCommand): void {
    if (this._status === OrderStatus.CANCELLED) {
      throw new Error('Order is already cancelled');
    }

    this._status = OrderStatus.CANCELLED;
    this.apply(new OrderCancelledEvent(
      this._id,
      command.reason,
      command.correlationId
    ));
  }

  private apply(event: any): void {
    this._uncommittedEvents.push(event);
  }

  markEventsAsCommitted(): void {
    this._uncommittedEvents = [];
  }
}
