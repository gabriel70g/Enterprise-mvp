import type { Request, Response, NextFunction } from 'express';
import { connect, NatsConnection, JSONCodec } from 'nats';
import { randomUUID } from 'crypto';

// Codec para codificar/decodificar mensajes JSON
const jsonCodec = JSONCodec();

let natsConnection: NatsConnection;

const connectToNats = async () => {
  if (natsConnection) return;

  try {
    const natsUrl = process.env.NATS_URL || 'nats://localhost:4222';
    natsConnection = await connect({ servers: natsUrl });
    console.log(`NATS Producer connected to ${natsConnection.getServer()}`);
  } catch (err) {
    console.error('Error connecting to NATS:', err);
    process.exit(1);
  }
};

// Conectamos al iniciar la aplicación
connectToNats();

export const createOrderCommandProxy = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customerId, items } = req.body;
    const correlationId = req.headers['x-correlation-id'] || randomUUID();
    const orderId = randomUUID();

    const command = {
      type: 'CreateOrderCommand',
      payload: { id: orderId, customerId, items, correlationId },
    };

    // Publicar el comando en un "subject" de NATS
    // Es un "fire and forget", muy rápido.
    const subject = 'orders.commands.create';
    natsConnection.publish(subject, jsonCodec.encode(command));

    // Responder inmediatamente con 202 Accepted
    res.status(202).json({ success: true, data: { orderId, correlationId, status: 'processing' } });
  } catch (error) {
    console.error('Error publishing command to Kafka:', error);
    res.status(500).json({ success: false, error: 'Failed to queue order for processing.' });
  }
};