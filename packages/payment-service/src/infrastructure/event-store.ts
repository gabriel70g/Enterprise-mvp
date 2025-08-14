import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';
import { BaseDomainEvent } from '../domain/events/base.event';

export interface EventMetadata {
  version: number;
  timestamp: Date;
  aggregateId: string;
  eventType: string;
  correlationId: string;
  causationId?: string;
}

export interface StoredEvent extends EventMetadata {
  id: string;
  data: any;
  aggregateVersion: number;
}

export interface EventStore {
  appendEvents(aggregateId: string, events: BaseDomainEvent[], expectedVersion?: number): Promise<void>;
  getEvents(aggregateId: string, fromVersion?: number): Promise<StoredEvent[]>;
  getEventsByType(eventType: string): Promise<StoredEvent[]>;
  getEventsByCorrelationId(correlationId: string): Promise<StoredEvent[]>;
  createSnapshot(aggregateId: string, aggregate: any, version: number): Promise<void>;
  getLatestSnapshot(aggregateId: string): Promise<any>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

export class KafkaEventStore implements EventStore {
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;
  private eventsTopic = 'domain-events';
  private snapshotsTopic = 'aggregate-snapshots';
  private events: Map<string, StoredEvent[]> = new Map();
  private snapshots: Map<string, any> = new Map();

  constructor() {
    this.kafka = new Kafka({
      clientId: 'payment-service-event-store',
      brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
    });
    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: 'payment-service-event-store-group' });
  }

  async connect(): Promise<void> {
    await this.producer.connect();
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: this.eventsTopic, fromBeginning: true });
    
    // Consumir eventos para mantener estado local
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
        if (!message.value) return;
        
        const event: StoredEvent = JSON.parse(message.value.toString());
        await this.storeEventLocally(event);
      },
    });
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect();
    await this.consumer.disconnect();
  }

  async appendEvents(aggregateId: string, events: BaseDomainEvent[], expectedVersion?: number): Promise<void> {
    const currentEvents = this.events.get(aggregateId) || [];
    const currentVersion = currentEvents.length;

    if (expectedVersion !== undefined && currentVersion !== expectedVersion) {
      throw new Error(`Concurrency conflict: expected version ${expectedVersion}, but current is ${currentVersion}`);
    }

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const storedEvent: StoredEvent = {
        id: this.generateEventId(),
        version: 1,
        timestamp: new Date(),
        aggregateId,
        eventType: event.constructor.name,
        correlationId: event.correlationId || 'unknown',
        causationId: event.causationId,
        data: event,
        aggregateVersion: currentVersion + i + 1,
      };

      // Publicar a Kafka
      await this.producer.send({
        topic: this.eventsTopic,
        messages: [{ value: JSON.stringify(storedEvent) }],
      });

      // Almacenar localmente
      await this.storeEventLocally(storedEvent);
    }
  }

  async getEvents(aggregateId: string, fromVersion: number = 0): Promise<StoredEvent[]> {
    const events = this.events.get(aggregateId) || [];
    return events.filter(event => event.aggregateVersion > fromVersion);
  }

  async getEventsByType(eventType: string): Promise<StoredEvent[]> {
    const allEvents: StoredEvent[] = [];
    for (const events of this.events.values()) {
      allEvents.push(...events.filter(event => event.eventType === eventType));
    }
    return allEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async getEventsByCorrelationId(correlationId: string): Promise<StoredEvent[]> {
    const allEvents: StoredEvent[] = [];
    for (const events of this.events.values()) {
      allEvents.push(...events.filter(event => event.correlationId === correlationId));
    }
    return allEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async createSnapshot(aggregateId: string, aggregate: any, version: number): Promise<void> {
    const snapshot = {
      aggregateId,
      version,
      timestamp: new Date(),
      data: aggregate,
    };

    // Publicar snapshot a Kafka
    await this.producer.send({
      topic: this.snapshotsTopic,
      messages: [{ value: JSON.stringify(snapshot) }],
    });

    // Almacenar localmente
    this.snapshots.set(aggregateId, snapshot);
  }

  async getLatestSnapshot(aggregateId: string): Promise<any> {
    return this.snapshots.get(aggregateId);
  }

  private async storeEventLocally(event: StoredEvent): Promise<void> {
    const { aggregateId } = event;
    if (!this.events.has(aggregateId)) {
      this.events.set(aggregateId, []);
    }
    this.events.get(aggregateId)!.push(event);
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
