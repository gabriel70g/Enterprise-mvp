import express from 'express';
import dotenv from 'dotenv';
import { CommandBus } from './application/command-bus';
import { KafkaEventStore } from './infrastructure/event-store';
import { OrderController } from './controllers/order.controller';
import { CreateOrderHandler, ConfirmOrderHandler, CancelOrderHandler } from './application/order.command.handlers';
import { traceInterceptor } from './middlewares/tracing';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// Interceptor de tracing simple - una línea para implementar
app.use('/', traceInterceptor);

// Initialize CQRS components
const eventStore = new KafkaEventStore(process.env.KAFKA_BROKERS || 'localhost:9092');
const commandBus = new CommandBus();

// Register command handlers
commandBus.register('CreateOrderCommand', new CreateOrderHandler(eventStore));
commandBus.register('ConfirmOrderCommand', new ConfirmOrderHandler(eventStore));
commandBus.register('CancelOrderCommand', new CancelOrderHandler(eventStore));

// Initialize controller
const orderController = new OrderController(commandBus);

// Routes
app.post('/orders', (req, res) => orderController.createOrder(req, res));
app.put('/orders/:orderId/confirm', (req, res) => orderController.confirmOrder(req, res));
app.put('/orders/:orderId/cancel', (req, res) => orderController.cancelOrder(req, res));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'order-service' });
});


// Start server
async function start() {
  try {
    await eventStore.connect();
    console.log('Connected to Kafka');
    
    app.listen(port, () => {
      console.log(`Order Service running on port ${port}`);
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


