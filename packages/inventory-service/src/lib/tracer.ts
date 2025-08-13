import { Kafka } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';


const kafka = new Kafka({ 
  clientId: 'api-gateway-tracer',
  brokers: process.env.KAFKA_BROKERS?.split(',') || ['kafka:9092'] 
});

const producer = kafka.producer();

// Conectar al iniciar
producer.connect().catch(console.error);

// Función simple de una línea para publicar trazas
export const publishTrace = async (data: any) => {
  try {
    // Generar ID único compatible con versiones antiguas de Node.js
    const id = uuidv4();
    
    await producer.send({ 
      topic: 'trace-events', 
      messages: [{ 
        value: JSON.stringify({ 
          id,
          timestamp: new Date().toISOString(),
          service: 'api-gateway',
          ...data 
        }) 
      }] 
    });
  } catch (error) {
    console.error('Error publishing trace:', error);
  }
};
