import { Kafka, Producer } from 'kafkajs';

export interface EventStore {
  appendEvents(aggregateId: string, events: any[]): Promise<void>;
}

export class KafkaEventStore implements EventStore {
  private producer: Producer;

  constructor(kafkaBrokers: string) {
    const kafka = new Kafka({
      clientId: 'order-service',
      brokers: kafkaBrokers.split(',')
    });
    this.producer = kafka.producer();
  }

  async connect(): Promise<void> {
    await this.producer.connect();
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect();
  }

  async appendEvents(aggregateId: string, events: any[]): Promise<void> {
    for (const event of events) {
      await this.producer.send({
        topic: 'orders-events',
        messages: [{
          key: aggregateId,
          value: JSON.stringify(event)
        }]
      });
    }
  }
}
