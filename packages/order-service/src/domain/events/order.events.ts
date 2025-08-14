import { BaseDomainEvent } from './base.event';

export class OrderCreatedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    public readonly customerId: string,
    public readonly items: Array<{ productId: string; quantity: number; price: number }>,
    public readonly totalAmount: number,
    public readonly correlationId: string
  ) {
    super(aggregateId, correlationId);
  }
}

export class OrderConfirmedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    public readonly totalAmount: number,
    public readonly correlationId: string
  ) {
    super(aggregateId, correlationId);
  }
}

export class OrderCancelledEvent extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    public readonly correlationId: string
  ) {
    super(aggregateId, correlationId);
  }
}
