import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { connect, NatsConnection, Subscription, JSONCodec } from 'nats';

const PORT = process.env.PORT || 8080;
const NATS_URL = process.env.NATS_URL || 'nats://localhost:4222';
const TRACE_TOPIC = 'trace-events';

// 1. Initialize Express and HTTP server
const app = express();
const server = http.createServer(app);

// 2. Initialize Socket.IO server
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for development
    methods: ['GET', 'POST'],
  },
});

// 3. Setup NATS client
let natsConnection: NatsConnection;
const jsonCodec = JSONCodec();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Main function to run the service
const run = async () => {
  try {
    natsConnection = await connect({
      servers: NATS_URL,
      reconnect: true,
      maxReconnectAttempts: -1,
      reconnectTimeWait: 5000,
    });
    console.log(`Connected to NATS server at ${natsConnection.getServer()}`);

    // Suscribirse al subject de trazas
    const subscription = natsConnection.subscribe(TRACE_TOPIC);
    console.log(`NATS consumer subscribed to subject: ${TRACE_TOPIC}`);

    // Procesar mensajes de forma asíncrona
    (async () => {
      for await (const msg of subscription) {
        try {
          const parsedTrace = jsonCodec.decode(msg.data);
          console.log(`Received trace from NATS:`, parsedTrace);

          // Filtrar trazas que empiecen con "gen-" (health checks)
          if (typeof parsedTrace === 'object' && parsedTrace !== null && 'correlationId' in parsedTrace && String(parsedTrace.correlationId).startsWith('gen-')) {
            console.log(`Filtering out health check trace: ${parsedTrace.correlationId}`);
            continue; // No enviar al dashboard
          }

          // Broadcast the trace to all connected socket clients
          io.emit('trace', parsedTrace);
          if (typeof parsedTrace === 'object' && parsedTrace !== null && 'id' in parsedTrace) {
            console.log(`Broadcasting trace event via Socket.IO to ${io.engine.clientsCount} client(s). [TraceID: ${parsedTrace.id}]`);
          }
        } catch (error) {
          console.error('Failed to process and broadcast trace message. Skipping.', {
            subject: msg.subject,
            // Loguear solo una parte del mensaje para no inundar los logs
            data: msg.data.toString().substring(0, 200) + '...',
            error,
          });
        }
      }
    })();
  } catch (error) {
    console.error('Failed to connect to NATS or subscribe:', error);
    process.exit(1);
  }

  // Handle Socket.IO connections
  io.on('connection', (socket) => {
    console.log(`A client connected: ${socket.id}`);
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  // Start the HTTP server
  server.listen(PORT, () => {
    console.log(`Trace BFF service listening on port ${PORT}`);
  });
};

run().catch((error) => {
  console.error('Error starting Trace BFF service:', error);
  process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Shutting down gracefully...');
  if (natsConnection) {
    await natsConnection.close();
  }
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
