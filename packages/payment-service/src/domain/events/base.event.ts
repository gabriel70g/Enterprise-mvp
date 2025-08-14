import { randomUUID } from 'crypto';

export abstract class BaseDomainEvent {
  public readonly id: string;
  public readonly occurredAt: Date;
  public readonly aggregateId: string;
  public readonly eventType: string;
  public readonly correlationId: string;
  public readonly causationId?: string;

  constructor(aggregateId: string, correlationId: string, causationId?: string) {
    this.id = randomUUID();
    this.occurredAt = new Date();
    this.aggregateId = aggregateId;
    this.eventType = this.constructor.name;
    this.correlationId = correlationId;
    this.causationId = causationId;
  }

  toJSON(): Record<string, any> {
    return {
      id: this.id,
      occurredAt: this.occurredAt.toISOString(),
      aggregateId: this.aggregateId,
      eventType: this.eventType,
      correlationId: this.correlationId,
      causationId: this.causationId
    };
  }
}
