import { BaseDomainEvent } from './base.event';

export class StockReservedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    public readonly orderId: string,
    public readonly productId: string,
    public readonly quantity: number,
    correlationId: string
  ) {
    super(aggregateId, correlationId);
  }

  toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      orderId: this.orderId,
      productId: this.productId,
      quantity: this.quantity,
      timestamp: this.occurredAt.toISOString()
    };
  }
}

export class StockReleasedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    public readonly orderId: string,
    public readonly productId: string,
    public readonly quantity: number,
    correlationId: string
  ) {
    super(aggregateId, correlationId);
  }

  toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      orderId: this.orderId,
      productId: this.productId,
      quantity: this.quantity,
      timestamp: this.occurredAt.toISOString()
    };
  }
}

export class InventoryUpdatedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    public readonly productId: string,
    public readonly availableQuantity: number,
    correlationId: string
  ) {
    super(aggregateId, correlationId);
  }

  toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      productId: this.productId,
      availableQuantity: this.availableQuantity,
      timestamp: this.occurredAt.toISOString()
    };
  }
}

export class StockReadyForDeliveryEvent extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    public readonly orderId: string,
    public readonly productId: string,
    public readonly quantity: number,
    correlationId: string
  ) {
    super(aggregateId, correlationId);
  }

  toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      orderId: this.orderId,
      productId: this.productId,
      quantity: this.quantity,
      timestamp: this.occurredAt.toISOString()
    };
  }
}
