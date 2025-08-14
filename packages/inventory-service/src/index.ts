import express from 'express';
import { KafkaEventStore } from './infrastructure/event-store';
import { EventSourcedInventoryRepository } from './infrastructure/inventory.repository';
import { CommandBus } from './application/command-bus';
import {
  CreateInventoryHandler,
  ReserveStockHandler,
  ReleaseStockHandler,
  MoveToInTransitHandler,
  UpdateStockHandler,
  DeactivateInventoryHandler,
  ActivateInventoryHandler
} from './application/inventory.command.handlers';
import { traceInterceptor } from './middlewares/tracing';
import { OrderEventConsumer } from './infrastructure/order.event.consumer';
import { InventoryController } from './controllers/inventory.controller';

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(express.json());
app.use('/', traceInterceptor);

// Event Store y Repository
const eventStore = new KafkaEventStore();
const inventoryRepository = new EventSourcedInventoryRepository(eventStore);

// Command Bus
const commandBus = new CommandBus();

// Registrar command handlers
commandBus.register('CreateInventoryCommand', new CreateInventoryHandler(inventoryRepository));
commandBus.register('ReserveStockCommand', new ReserveStockHandler(inventoryRepository));
commandBus.register('ReleaseStockCommand', new ReleaseStockHandler(inventoryRepository));
commandBus.register('MoveToInTransitCommand', new MoveToInTransitHandler(inventoryRepository));
commandBus.register('UpdateStockCommand', new UpdateStockHandler(inventoryRepository));
commandBus.register('DeactivateInventoryCommand', new DeactivateInventoryHandler(inventoryRepository));
commandBus.register('ActivateInventoryCommand', new ActivateInventoryHandler(inventoryRepository));

// Controller
const inventoryController = new InventoryController(commandBus, inventoryRepository);

// API Endpoints usando el Controller
app.post('/inventory', (req, res) => inventoryController.createInventory(req, res));

app.post('/inventory/:id/reserve', (req, res) => inventoryController.reserveStock(req, res));

app.post('/inventory/:id/release', (req, res) => inventoryController.releaseStock(req, res));

app.post('/inventory/:id/move-to-in-transit', (req, res) => inventoryController.moveToInTransit(req, res));

app.put('/inventory/:id/stock', (req, res) => inventoryController.updateStock(req, res));

app.post('/inventory/:id/deactivate', (req, res) => inventoryController.deactivateInventory(req, res));

app.post('/inventory/:id/activate', (req, res) => inventoryController.activateInventory(req, res));

// Query endpoints usando el Controller
app.get('/inventory/:id', (req, res) => inventoryController.getInventory(req, res));
app.get('/inventory', (req, res) => inventoryController.getAllInventories(req, res));
app.get('/inventory/low-stock', (req, res) => inventoryController.getLowStockInventories(req, res));

// Health check
app.get('/health', (req, res) => {
  return res.status(200).json({ status: 'OK', service: 'inventory-service' });
});

// Inicializar servicios
async function startServices() {
  try {
    await eventStore.connect();
    console.log('✅ Event Store connected');
    
    // Iniciar consumidor de eventos de órdenes
    const orderEventConsumer = new OrderEventConsumer(eventStore);
    await orderEventConsumer.start();
    console.log('✅ Order Event Consumer started');
    
    app.listen(PORT, () => {
      console.log(`🚀 Inventory Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start services:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 Shutting down Inventory Service...');
  await eventStore.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 Shutting down Inventory Service...');
  await eventStore.disconnect();
  process.exit(0);
});

// Iniciar servicios
startServices();


