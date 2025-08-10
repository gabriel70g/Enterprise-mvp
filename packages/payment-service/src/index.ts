import express from 'express';
import dotenv from 'dotenv';
import { CommandBus } from './application/command-bus';
import { KafkaEventStore } from './infrastructure/event-store';
import { PaymentController } from './controllers/payment.controller';
import { ProcessPaymentHandler, CancelPaymentHandler } from './application/payment.command.handlers';

dotenv.config();

const app = express();
const port = process.env.PORT || 3002;

// Middleware
app.use(express.json());

// Initialize CQRS components
const eventStore = new KafkaEventStore(process.env.KAFKA_BROKERS || 'localhost:9092');
const commandBus = new CommandBus();

// Register command handlers
commandBus.register('ProcessPaymentCommand', new ProcessPaymentHandler(eventStore));
commandBus.register('CancelPaymentCommand', new CancelPaymentHandler(eventStore));

// Initialize controller
const paymentController = new PaymentController(commandBus);

// Routes
app.post('/payments', (req, res) => paymentController.processPayment(req, res));
app.put('/payments/:orderId/cancel', (req, res) => paymentController.cancelPayment(req, res));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'payment-service' });
});

// Start server
async function start() {
  try {
    await eventStore.connect();
    console.log('Connected to Kafka');

    app.listen(port, () => {
      console.log(`Payment Service running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start service:', error);
    process.exit(1);
  }
}

start();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await eventStore.disconnect();
  process.exit(0);
});


