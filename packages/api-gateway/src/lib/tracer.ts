import { Kafka, Producer, logLevel, ProducerRecord } from 'kafkajs';
import { randomUUID } from 'crypto';

const KAFKA_BROKERS = process.env.KAFKA_BROKERS?.split(',') || ['kafka:9092'];
const TRACE_TOPIC = 'trace-events';

export interface TraceEvent {
  id: string;
  correlationId: string;
  service: 'api-gateway';
  action: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
  duration: number;
  payload: Record<string, unknown>;
}

class Tracer {
  private producer: Producer;
  private static instance: Tracer;
  private isConnected = false;

  private constructor() {
    const kafka = new Kafka({
      clientId: 'api-gateway-tracer',
      brokers: KAFKA_BROKERS,
      logLevel: logLevel.WARN,
    });
    this.producer = kafka.producer({
      allowAutoTopicCreation: false,
      retry: { retries: 5 },
    });
  }

  public static getInstance(): Tracer {
    if (!Tracer.instance) {
      Tracer.instance = new Tracer();
    }
    return Tracer.instance;
  }

  public async connect() {
    if (this.isConnected) return;
    try {
      await this.producer.connect();
      this.isConnected = true;
      console.log('Kafka tracer producer connected successfully.');
    } catch (error) {
      console.error('Failed to connect Kafka tracer producer:', error);
    }
  }

  public async send(event: Omit<TraceEvent, 'id' | 'service' | 'timestamp'>) {
    if (!this.isConnected) return;

    const trace: TraceEvent = {
      id: randomUUID(),
      service: 'api-gateway',
      timestamp: new Date().toISOString(),
      ...event,
    };

    await this.producer.send({ topic: TRACE_TOPIC, messages: [{ value: JSON.stringify(trace) }] });
  }
}

export const tracer = Tracer.getInstance();
