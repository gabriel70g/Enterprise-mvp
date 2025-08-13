import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { Kafka, logLevel } from 'kafkajs';

const PORT = process.env.PORT || 8080;
const KAFKA_BROKERS = process.env.KAFKA_BROKERS?.split(',') || ['kafka:9092'];
const TRACE_TOPIC = 'trace-events';
const KAFKA_GROUP_ID = 'trace-bff-group';

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

// 3. Setup Kafka client and consumer
const kafka = new Kafka({
  clientId: 'trace-bff',
  brokers: KAFKA_BROKERS,
  logLevel: logLevel.INFO,
});

const consumer = kafka.consumer({ groupId: KAFKA_GROUP_ID });

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

/**
 * Connects the Kafka consumer with a retry mechanism to handle startup race conditions.
 * @param consumer The Kafka consumer instance.
 * @param retries Number of retry attempts.
 * @param delay Delay between retries in milliseconds.
 */
const connectWithRetry = async (consumer: ReturnType<typeof kafka.consumer>, retries = 5, delay = 3000) => {
  for (let i = 1; i <= retries; i++) {
    try {
      await consumer.connect();
      console.log('Kafka consumer connected successfully.');
      return; // Exit loop on success
    } catch (err) {
      console.warn(`[Attempt ${i}/${retries}] Kafka connection failed. Retrying in ${delay / 1000}s...`);
      if (i === retries) {
        console.error('Fatal: Could not connect to Kafka after multiple retries.');
        throw err; // Rethrow the last error
      }
      await new Promise(res => setTimeout(res, delay));
    }
  }
};

// Main function to run the service
const run = async () => {
  await connectWithRetry(consumer);
  await consumer.subscribe({ topic: TRACE_TOPIC, fromBeginning: true });

  console.log(`Kafka consumer subscribed to topic: ${TRACE_TOPIC}`);

  // Handle incoming Kafka messages
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      if (!message.value) return;

      const trace = message.value.toString();
      console.log(`Received trace from Kafka: ${trace}`); // Esto confirma que el mensaje de Kafka llegó

      // Broadcast the trace to all connected socket clients
      const parsedTrace = JSON.parse(trace);
      io.emit('trace', parsedTrace);
      // Este nuevo log confirma la emisión y nos dice cuántos clientes están escuchando
      console.log(`Broadcasting trace event via Socket.IO to ${io.engine.clientsCount} client(s). [TraceID: ${parsedTrace.id}]`);
    },
  });

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
  await consumer.disconnect();
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
