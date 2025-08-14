import { Kafka, logLevel, EachMessagePayload } from 'kafkajs';
import { PaymentConfirmedHandler } from '../application/payment.event.handler';
import { KafkaEventStore } from './event-store';

export class PaymentEventConsumer {
  private kafka: Kafka;
  private consumer: any;
  private eventHandler: PaymentConfirmedHandler;

  constructor(eventStore: KafkaEventStore) {
    this.kafka = new Kafka({
      clientId: 'order-service-payment-consumer',
      brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
      logLevel: logLevel.INFO,
    });
    
    this.consumer = this.kafka.consumer({ groupId: 'order-service-payment-group' });
    this.eventHandler = new PaymentConfirmedHandler(eventStore);
  }

  async start(): Promise<void> {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'payments-events', fromBeginning: true });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
        if (!message.value) return;

        try {
          const event = JSON.parse(message.value.toString());
          console.log(`Received payment event from Kafka: ${event.type}`);

          // Solo procesar PaymentConfirmedEvent
          if (event.type === 'PaymentConfirmedEvent') {
            await this.eventHandler.handle(event);
          }
        } catch (error) {
          console.error('Error processing payment event:', error);
        }
      },
    });

    console.log('Payment event consumer started successfully');
  }

  async stop(): Promise<void> {
    await this.consumer.disconnect();
  }
}
