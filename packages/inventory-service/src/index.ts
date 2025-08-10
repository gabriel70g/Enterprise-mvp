import express from 'express';
import dotenv from 'dotenv';
import { CommandBus } from './application/command-bus';
import { KafkaEventStore } from './infrastructure/event-store';
import { InventoryController } from './controllers/inventory.controller';
import { ReserveProductHandler, ReleaseProductHandler, UpdateInventoryHandler } from './application/inventory.command.handlers';

dotenv.config();

const app = express();
const port = process.env.PORT || 3003;

// Middleware
app.use(express.json());

// Initialize CQRS components
const eventStore = new KafkaEventStore(process.env.KAFKA_BROKERS || 'localhost:9092');
const commandBus = new CommandBus();

// Register command handlers
commandBus.register('ReserveProductCommand', new ReserveProductHandler(eventStore));
commandBus.register('ReleaseProductCommand', new ReleaseProductHandler(eventStore));
commandBus.register('UpdateInventoryCommand', new UpdateInventoryHandler(eventStore));

// Initialize controller
const inventoryController = new InventoryController(commandBus);

// Routes
app.post('/inventory/reserve', (req, res) => inventoryController.reserveProduct(req, res));
app.post('/inventory/release', (req, res) => inventoryController.releaseProduct(req, res));
app.post('/inventory/update', (req, res) => inventoryController.updateInventory(req, res));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'inventory-service' });
});

// Start server
async function start() {
  try {
    await eventStore.connect();
    console.log('Connected to Kafka');

    app.listen(port, () => {
      console.log(`Inventory Service running on port ${port}`);
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


