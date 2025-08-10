import { BaseDomainEvent } from './base.event';

export class PaymentInitiatedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    public readonly orderId: string,
    public readonly amount: number,
    public readonly correlationId: string
  ) {
    super(aggregateId);
  }
}

export class PaymentProcessedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    public readonly orderId: string,
    public readonly amount: number,
    public readonly correlationId: string
  ) {
    super(aggregateId);
  }
}

export class PaymentFailedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    public readonly orderId: string,
    public readonly reason: string,
    public readonly correlationId: string
  ) {
    super(aggregateId);
  }
}
