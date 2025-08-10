import { BaseDomainEvent } from './base.event';

export class OrderCreatedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    public readonly customerId: string,
    public readonly items: Array<{ productId: string; quantity: number }>,
    public readonly correlationId: string
  ) {
    super(aggregateId);
  }
}

export class OrderConfirmedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    public readonly correlationId: string
  ) {
    super(aggregateId);
  }
}

export class OrderCancelledEvent extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    public readonly reason: string,
    public readonly correlationId: string
  ) {
    super(aggregateId);
  }
}
