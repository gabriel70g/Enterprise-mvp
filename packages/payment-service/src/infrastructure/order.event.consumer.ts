import { Kafka, logLevel, EachMessagePayload } from 'kafkajs';
import { OrderConfirmedEventHandler } from '../application/order.event.handlers';
import { KafkaEventStore } from './event-store';

export class OrderEventConsumer {
  private kafka: Kafka;
  private consumer: any;
  private eventHandler: OrderConfirmedEventHandler;

  constructor(eventStore: KafkaEventStore) {
    this.kafka = new Kafka({
      clientId: 'payment-service-order-consumer',
      brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
      logLevel: logLevel.INFO,
    });
    
    this.consumer = this.kafka.consumer({ groupId: 'payment-service-group' });
    this.eventHandler = new OrderConfirmedEventHandler(eventStore);
  }

  async start(): Promise<void> {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'orders-events', fromBeginning: true });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
        if (!message.value) return;

        try {
          const event = JSON.parse(message.value.toString());
          console.log(`Received event from Kafka: ${event.type}`);

          // Solo procesar OrderConfirmedEvent
          if (event.type === 'OrderConfirmedEvent') {
            await this.eventHandler.handle(event);
          }
        } catch (error) {
          console.error('Error processing order event:', error);
        }
      },
    });

    console.log('Order event consumer started successfully');
  }

  async stop(): Promise<void> {
    await this.consumer.disconnect();
  }
}
