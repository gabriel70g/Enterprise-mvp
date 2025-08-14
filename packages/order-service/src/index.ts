import express from 'express';
import { CommandBus } from './application/command-bus';
import { CreateOrderHandler, ConfirmOrderHandler, CancelOrderHandler } from './application/order.command.handlers';
import { CreateOrderCommand, ConfirmOrderCommand, CancelOrderCommand } from './domain/commands/order.commands';
import { KafkaEventStore } from './infrastructure/event-store';
import { EventSourcedOrderRepository } from './infrastructure/order.repository';
import { PostgresProductRepository } from './infrastructure/product.repository';
import { PaymentEventConsumer } from './infrastructure/payment.event.consumer';
import { traceInterceptor } from './middlewares/tracing';

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(traceInterceptor);

// Initialize Event Store and Repositories
const eventStore = new KafkaEventStore();
const orderRepository = new EventSourcedOrderRepository(eventStore);
const productRepository = new PostgresProductRepository();

// Initialize Command Bus
const commandBus = new CommandBus();

// Register command handlers
commandBus.register('CreateOrderCommand', new CreateOrderHandler(orderRepository, productRepository));
commandBus.register('ConfirmOrderCommand', new ConfirmOrderHandler(orderRepository));
commandBus.register('CancelOrderCommand', new CancelOrderHandler(orderRepository, productRepository));

// Initialize payment event consumer
const paymentEventConsumer = new PaymentEventConsumer(eventStore);

// API Endpoints
app.post('/orders', async (req, res) => {
  try {
    const { customerId, items, correlationId } = req.body;
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Validar request
    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invalid request: customerId and items array required' });
    }

    // Validar estructura de items
    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({ error: 'Invalid item: productId and quantity > 0 required' });
      }
    }

    const command = new CreateOrderCommand(correlationId, customerId, items);
    await commandBus.execute(command);

    return res.status(201).json({
      message: 'Order created successfully',
      orderId,
      correlationId
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create order' });
  }
});

app.post('/orders/:orderId/confirm', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { correlationId } = req.body;

    if (!correlationId) {
      return res.status(400).json({ error: 'correlationId is required' });
    }

    const command = new ConfirmOrderCommand(correlationId, orderId);
    await commandBus.execute(command);

    return res.json({
      message: 'Order confirmed successfully',
      orderId,
      correlationId
    });
  } catch (error) {
    console.error('Error confirming order:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to confirm order' });
  }
});

app.post('/orders/:orderId/cancel', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { correlationId } = req.body;

    if (!correlationId) {
      return res.status(400).json({ error: 'correlationId is required' });
    }

    const command = new CancelOrderCommand(correlationId, orderId, 'User cancelled');
    await commandBus.execute(command);

    return res.json({
      message: 'Order cancelled successfully',
      orderId,
      correlationId
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to cancel order' });
  }
});

// Product catalog endpoints
app.get('/products', async (req, res) => {
  try {
    const { category } = req.query;
    const products = category 
      ? await productRepository.findByCategory(category as string)
      : await productRepository.findActive();
    
    res.json(products.map(p => p.toSnapshot()));
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productRepository.findById(id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    return res.json(product.toSnapshot());
  } catch (error) {
    console.error('Error fetching product:', error);
    return res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'order-service' });
});

// Start server
async function start() {
  try {
    await eventStore.connect();
    console.log('✅ Connected to Event Store (Kafka)');

    // Start payment event consumer
    await paymentEventConsumer.start();
    console.log('✅ Payment event consumer started');

    app.listen(port, () => {
      console.log(`🚀 Order Service running on port ${port}`);
      console.log(`📊 Event Store: Kafka`);
      console.log(`🔗 Repository: Event Sourced with Snapshots`);
      console.log(`🗄️  Database: PostgreSQL with Product Catalog`);
    });
  } catch (error) {
    console.error('❌ Failed to start Order Service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 SIGTERM received, shutting down gracefully');
  await paymentEventConsumer.stop();
  await eventStore.disconnect();
  await productRepository.close();
  process.exit(0);
});

start();


