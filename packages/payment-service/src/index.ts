import express from 'express';
import { CommandBus } from './application/command-bus';
import { ProcessPaymentHandler, CancelPaymentHandler } from './application/payment.command.handlers';
import { ProcessPaymentCommand, CancelPaymentCommand } from './domain/commands/payment.commands';
import { KafkaEventStore } from './infrastructure/event-store';
import { EventSourcedPaymentRepository } from './infrastructure/payment.repository';
import { OrderEventConsumer } from './infrastructure/order.event.consumer';
import { traceInterceptor } from './middlewares/tracing';

const app = express();
const port = process.env.PORT || 3002;

app.use(express.json());
app.use(traceInterceptor);

// Initialize Event Store and Repository
const eventStore = new KafkaEventStore();
const paymentRepository = new EventSourcedPaymentRepository(eventStore);

// Initialize Command Bus
const commandBus = new CommandBus();

// Register command handlers
commandBus.register('ProcessPaymentCommand', new ProcessPaymentHandler(paymentRepository));
commandBus.register('CancelPaymentCommand', new CancelPaymentHandler(paymentRepository));

// Initialize order event consumer
const orderEventConsumer = new OrderEventConsumer(eventStore);

// API Endpoints
app.post('/payments', async (req, res) => {
  try {
    const { orderId, amount, customerId, correlationId } = req.body;

    // Validar request
    if (!orderId || !amount || !correlationId) {
      return res.status(400).json({ error: 'orderId, amount, and correlationId are required' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than zero' });
    }

    const command = new ProcessPaymentCommand(correlationId, orderId, amount);
    await commandBus.execute(command);

    return res.status(201).json({
      message: 'Payment processed successfully',
      paymentId: command.id,
      orderId,
      amount,
      correlationId
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to process payment' });
  }
});

app.post('/payments/:paymentId/cancel', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { correlationId } = req.body;

    if (!correlationId) {
      return res.status(400).json({ error: 'correlationId is required' });
    }

    const command = new CancelPaymentCommand(correlationId, paymentId, 'User cancelled');
    await commandBus.execute(command);

    return res.json({
      message: 'Payment cancelled successfully',
      paymentId,
      correlationId
    });
  } catch (error) {
    console.error('Error cancelling payment:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to cancel payment' });
  }
});

// Payment status endpoints
app.get('/payments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await paymentRepository.findById(id);
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    return res.json(payment.toSnapshot());
  } catch (error) {
    console.error('Error fetching payment:', error);
    return res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

app.get('/payments/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const payment = await paymentRepository.findByOrderId(orderId);
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found for this order' });
    }
    
    return res.json(payment.toSnapshot());
  } catch (error) {
    console.error('Error fetching payment by order:', error);
    return res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

app.get('/payments', async (req, res) => {
  try {
    const { status } = req.query;
    let payments;
    
    switch (status) {
      case 'pending':
        payments = await paymentRepository.findPending();
        break;
      case 'confirmed':
        payments = await paymentRepository.findConfirmed();
        break;
      case 'failed':
        payments = await paymentRepository.findFailed();
        break;
      default:
        payments = await paymentRepository.findAll();
    }
    
    return res.json(payments.map(p => p.toSnapshot()));
  } catch (error) {
    console.error('Error fetching payments:', error);
    return res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'payment-service' });
});

// Start server
async function start() {
  try {
    await eventStore.connect();
    console.log('✅ Connected to Event Store (Kafka)');

    // Start order event consumer
    await orderEventConsumer.start();
    console.log('✅ Order event consumer started');

    app.listen(port, () => {
      console.log(`🚀 Payment Service running on port ${port}`);
      console.log(`📊 Event Store: Kafka`);
      console.log(`🔗 Repository: Event Sourced with Snapshots`);
      console.log(`💳 Payment Processing: Simulated Gateway (90% success rate)`);
    });
  } catch (error) {
    console.error('❌ Failed to start Payment Service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 SIGTERM received, shutting down gracefully');
  await orderEventConsumer.stop();
  await eventStore.disconnect();
  process.exit(0);
});

start();


