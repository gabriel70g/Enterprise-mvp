import { BaseDomainEvent } from './events/base.event';
import { OrderCreatedEvent, OrderConfirmedEvent, OrderCancelledEvent } from './events/order.events';

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface OrderState {
  id: string;
  customerId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'created' | 'confirmed' | 'cancelled';
  createdAt: Date;
  confirmedAt?: Date;
  cancelledAt?: Date;
  correlationId: string;
}

export class Order {
  private _id: string;
  private _customerId: string;
  private _items: OrderItem[];
  private _totalAmount: number;
  private _status: 'created' | 'confirmed' | 'cancelled';
  private _createdAt: Date;
  private _confirmedAt?: Date;
  private _cancelledAt?: Date;
  private _correlationId: string;
  private _version: number = 0;
  private _uncommittedEvents: BaseDomainEvent[] = [];

  constructor(
    id: string,
    customerId: string,
    items: OrderItem[],
    correlationId: string
  ) {
    this._id = id;
    this._customerId = customerId;
    this._items = items;
    this._totalAmount = this.calculateTotal(items);
    this._status = 'created';
    this._createdAt = new Date();
    this._correlationId = correlationId;
    
    // Aplicar evento de creación
    this.apply(new OrderCreatedEvent(id, customerId, items, this._totalAmount, correlationId));
  }

  // Factory method para reconstruir desde eventos
  static fromEvents(events: any[]): Order {
    if (events.length === 0) {
      throw new Error('Cannot reconstruct order from empty event stream');
    }

    const order = new (Order as any)();
    order._uncommittedEvents = [];
    
    for (const event of events) {
      order.applyEvent(event);
      order._version++;
    }

    return order;
  }

  // Factory method para reconstruir desde snapshot + eventos
  static fromSnapshot(snapshot: any, events: any[]): Order {
    const order = new (Order as any)();
    order._id = snapshot.id;
    order._customerId = snapshot.customerId;
    order._items = snapshot.items;
    order._totalAmount = snapshot.totalAmount;
    order._status = snapshot.status;
    order._createdAt = new Date(snapshot.createdAt);
    order._confirmedAt = snapshot.confirmedAt ? new Date(snapshot.confirmedAt) : undefined;
    order._cancelledAt = snapshot.cancelledAt ? new Date(snapshot.cancelledAt) : undefined;
    order._correlationId = snapshot.correlationId;
    order._version = snapshot.version;
    order._uncommittedEvents = [];

    // Aplicar eventos posteriores al snapshot
    for (const event of events) {
      order.applyEvent(event);
      order._version++;
    }

    return order;
  }

  // Métodos de negocio
  confirm(): void {
    if (this._status !== 'created') {
      throw new Error(`Cannot confirm order in status: ${this._status}`);
    }

    this._status = 'confirmed';
    this._confirmedAt = new Date();
    this.apply(new OrderConfirmedEvent(this._id, this._totalAmount, this._correlationId));
  }

  cancel(): void {
    if (this._status === 'cancelled') {
      throw new Error('Order is already cancelled');
    }

    this._status = 'cancelled';
    this._cancelledAt = new Date();
    this.apply(new OrderCancelledEvent(this._id, this._correlationId));
  }

  // Getters
  get id(): string { return this._id; }
  get customerId(): string { return this._customerId; }
  get items(): OrderItem[] { return [...this._items]; }
  get totalAmount(): number { return this._totalAmount; }
  get status(): string { return this._status; }
  get createdAt(): Date { return this._createdAt; }
  get confirmedAt(): Date | undefined { return this._confirmedAt; }
  get cancelledAt(): Date | undefined { return this._cancelledAt; }
  get correlationId(): string { return this._correlationId; }
  get version(): number { return this._version; }
  get uncommittedEvents(): BaseDomainEvent[] { return [...this._uncommittedEvents]; }

  // Métodos de Event Sourcing
  private apply(event: BaseDomainEvent): void {
    this.applyEvent(event);
    this._uncommittedEvents.push(event);
  }

  private applyEvent(event: any): void {
    switch (event.constructor.name) {
      case 'OrderCreatedEvent':
        this._id = event.aggregateId;
        this._customerId = event.customerId;
        this._items = event.items;
        this._totalAmount = event.totalAmount;
        this._status = 'created';
        this._createdAt = new Date(event.timestamp);
        this._correlationId = event.correlationId;
        break;

      case 'OrderConfirmedEvent':
        this._status = 'confirmed';
        this._confirmedAt = new Date(event.timestamp);
        break;

      case 'OrderCancelledEvent':
        this._status = 'cancelled';
        this._cancelledAt = new Date(event.timestamp);
        break;

      default:
        throw new Error(`Unknown event type: ${event.constructor.name}`);
    }
  }

  markEventsAsCommitted(): void {
    this._uncommittedEvents = [];
  }

  // Métodos de utilidad
  private calculateTotal(items: OrderItem[]): number {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  // Método para crear snapshot
  toSnapshot(): any {
    return {
      id: this._id,
      customerId: this._customerId,
      items: this._items,
      totalAmount: this._totalAmount,
      status: this._status,
      createdAt: this._createdAt.toISOString(),
      confirmedAt: this._confirmedAt?.toISOString(),
      cancelledAt: this._cancelledAt?.toISOString(),
      correlationId: this._correlationId,
      version: this._version,
    };
  }
}
