import { randomUUID } from 'crypto';

export abstract class BaseDomainEvent {
  public readonly id: string;
  public readonly occurredAt: Date;
  public readonly aggregateId: string;
  public readonly eventType: string;

  constructor(aggregateId: string) {
    this.id = randomUUID();
    this.occurredAt = new Date();
    this.aggregateId = aggregateId;
    this.eventType = this.constructor.name;
  }

  toJSON(): Record<string, any> {
    return {
      id: this.id,
      occurredAt: this.occurredAt.toISOString(),
      aggregateId: this.aggregateId,
      eventType: this.eventType
    };
  }
}
