import { connect, NatsConnection, JSONCodec } from 'nats';
import { randomUUID } from 'crypto';

const jsonCodec = JSONCodec();
let natsConnection: NatsConnection | null = null;

const connectToNats = async () => {
  try {
    const natsUrl = process.env.NATS_URL || 'nats://localhost:4222';
    const nc = await connect({
      servers: natsUrl,
      reconnect: true, // NATS client will handle reconnects automatically
      maxReconnectAttempts: -1, // Infinite retries
      reconnectTimeWait: 5000, // Wait 5s between retries
    });
    natsConnection = nc;
    console.log(`NATS Tracer connected to ${natsConnection.getServer()}`);

    // Log status changes for better observability
    (async () => {
      for await (const status of natsConnection.status()) {
        console.info(`[NATS Tracer] Status changed: ${status.type}`);
      }
    })().then();
  } catch (err) {
    console.error('Initial NATS connection for tracing failed. Client will attempt to reconnect.', err);
  }
};

// Conectar al iniciar la aplicación
connectToNats();

export const publishTrace = (data: any) => {
  // Si la conexión no está lista o se está reconectando, simplemente no enviamos la traza.
  // Esto evita llenar los logs de errores y confía en la reconexión automática.
  if (!natsConnection || natsConnection.isClosed()) {
    return;
  }
  const traceData = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    ...data,
  };
  // Publicamos en un subject específico para trazas, de forma "fire and forget"
  natsConnection.publish('trace-events', jsonCodec.encode(traceData));
};