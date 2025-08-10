import { BaseDomainEvent } from './base.event';

export class ProductReservedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    public readonly orderId: string,
    public readonly productId: string,
    public readonly quantity: number,
    public readonly correlationId: string
  ) {
    super(aggregateId);
  }
}

export class ProductReleasedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    public readonly orderId: string,
    public readonly productId: string,
    public readonly quantity: number,
    public readonly correlationId: string
  ) {
    super(aggregateId);
  }
}

export class InventoryUpdatedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    public readonly productId: string,
    public readonly newQuantity: number,
    public readonly correlationId: string
  ) {
    super(aggregateId);
  }
}
