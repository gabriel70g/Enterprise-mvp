import { Kafka, logLevel, KafkaMessage, EachMessagePayload } from 'kafkajs';
import { OrderConfirmedEventHandler } from '../application/order.event.handlers';
import { OrderCreatedHandler } from '../application/order.created.handler';
import { KafkaEventStore } from './event-store';

export class OrderEventConsumer {
  private kafka: Kafka;
  private consumer: any;
  private orderCreatedHandler: OrderCreatedHandler;
  private orderConfirmedHandler: OrderConfirmedEventHandler;

  constructor(eventStore: KafkaEventStore) {
    this.kafka = new Kafka({
      clientId: 'inventory-service-order-consumer',
      brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
      logLevel: logLevel.INFO,
    });
    
    this.consumer = this.kafka.consumer({ groupId: 'inventory-service-group' });
    this.orderCreatedHandler = new OrderCreatedHandler(eventStore);
    this.orderConfirmedHandler = new OrderConfirmedEventHandler(eventStore);
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

          // Procesar OrderCreatedEvent (verificar y reservar stock)
          if (event.type === 'OrderCreatedEvent') {
            await this.orderCreatedHandler.handle(event);
          }
          
          // Procesar OrderConfirmedEvent (notificar delivery)
          if (event.type === 'OrderConfirmedEvent') {
            await this.orderConfirmedHandler.handle(event);
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
