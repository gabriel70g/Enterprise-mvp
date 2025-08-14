import { Inventory } from '../domain/inventory.aggregate';
import { EventStore, StoredEvent } from './event-store';

export interface InventoryRepository {
  save(inventory: Inventory): Promise<void>;
  findById(id: string): Promise<Inventory | null>;
  findByProductId(productId: string): Promise<Inventory | null>;
  findByCorrelationId(correlationId: string): Promise<Inventory | null>;
  findAll(): Promise<Inventory[]>;
  findActive(): Promise<Inventory[]>;
  findLowStock(): Promise<Inventory[]>;
  findByCategory(category: string): Promise<Inventory[]>;
}

export class EventSourcedInventoryRepository implements InventoryRepository {
  private readonly SNAPSHOT_INTERVAL = 10; // Crear snapshot cada 10 eventos

  constructor(private eventStore: EventStore) {}

  async save(inventory: Inventory): Promise<void> {
    const events = inventory.uncommittedEvents;
    if (events.length === 0) return;

    // Obtener versión actual del agregado
    const currentEvents = await this.eventStore.getEvents(inventory.id);
    const expectedVersion = currentEvents.length;

    // Guardar eventos con control de concurrencia
    await this.eventStore.appendEvents(inventory.id, events, expectedVersion);

    // Crear snapshot si es necesario
    if (this.shouldCreateSnapshot(currentEvents.length + events.length)) {
      await this.eventStore.createSnapshot(inventory.id, inventory.toSnapshot(), inventory.version);
    }

    // Marcar eventos como committeados
    inventory.markEventsAsCommitted();
  }

  async findById(id: string): Promise<Inventory | null> {
    try {
      // Intentar obtener snapshot más reciente
      const snapshot = await this.eventStore.getLatestSnapshot(id);
      
      let events: StoredEvent[] = [];
      
      if (snapshot) {
        // Obtener eventos posteriores al snapshot
        events = await this.eventStore.getEvents(id, snapshot.version);
        return Inventory.fromSnapshot(snapshot.data, events);
      } else {
        // Reconstruir completamente desde eventos
        events = await this.eventStore.getEvents(id);
        if (events.length === 0) return null;
        
        return Inventory.fromEvents(events);
      }
    } catch (error) {
      console.error(`Error finding inventory by id ${id}:`, error);
      return null;
    }
  }

  async findByProductId(productId: string): Promise<Inventory | null> {
    try {
      // Buscar eventos de InventoryUpdatedEvent para el producto
      const events = await this.eventStore.getEventsByType('InventoryUpdatedEvent');
      const inventoryEvent = events.find(event => event.data.productId === productId);
      
      if (!inventoryEvent) return null;
      
      return this.findById(inventoryEvent.aggregateId);
    } catch (error) {
      console.error(`Error finding inventory by productId ${productId}:`, error);
      return null;
    }
  }

  async findByCorrelationId(correlationId: string): Promise<Inventory | null> {
    try {
      const events = await this.eventStore.getEventsByCorrelationId(correlationId);
      if (events.length === 0) return null;

      // Agrupar eventos por aggregateId
      const eventsByAggregate = this.groupEventsByAggregate(events);
      
      // Tomar el primer agregado (asumiendo que correlationId es único por inventario)
      const firstEntry = eventsByAggregate.entries().next();
      if (!firstEntry.done) {
        const [aggregateId, aggregateEvents] = firstEntry.value;
        return this.findById(aggregateId);
      }
      
      return null;
    } catch (error) {
      console.error(`Error finding inventory by correlationId ${correlationId}:`, error);
      return null;
    }
  }

  async findAll(): Promise<Inventory[]> {
    try {
      // Obtener todos los eventos de inventario
      const inventoryEvents = await this.eventStore.getEventsByType('InventoryUpdatedEvent');
      
      const inventories: Inventory[] = [];
      for (const event of inventoryEvents) {
        const inventory = await this.findById(event.aggregateId);
        if (inventory) inventories.push(inventory);
      }
      
      return inventories;
    } catch (error) {
      console.error('Error finding all inventories:', error);
      return [];
    }
  }

  async findActive(): Promise<Inventory[]> {
    try {
      const allInventories = await this.findAll();
      return allInventories.filter(inventory => inventory.isActive);
    } catch (error) {
      console.error('Error finding active inventories:', error);
      return [];
    }
  }

  async findLowStock(): Promise<Inventory[]> {
    try {
      const allInventories = await this.findAll();
      return allInventories.filter(inventory => inventory.isLowStock());
    } catch (error) {
      console.error('Error finding low stock inventories:', error);
      return [];
    }
  }

  async findByCategory(category: string): Promise<Inventory[]> {
    try {
      const allInventories = await this.findAll();
      return allInventories.filter(inventory => inventory.category === category);
    } catch (error) {
      console.error('Error finding inventories by category:', error);
      return [];
    }
  }

  private shouldCreateSnapshot(eventCount: number): boolean {
    return eventCount % this.SNAPSHOT_INTERVAL === 0;
  }

  private groupEventsByAggregate(events: StoredEvent[]): Map<string, StoredEvent[]> {
    const grouped = new Map<string, StoredEvent[]>();
    
    for (const event of events) {
      if (!grouped.has(event.aggregateId)) {
        grouped.set(event.aggregateId, []);
      }
      grouped.get(event.aggregateId)!.push(event);
    }
    
    // Ordenar eventos por versión dentro de cada agregado
    for (const [_, aggregateEvents] of grouped) {
      aggregateEvents.sort((a, b) => a.aggregateVersion - b.aggregateVersion);
    }
    
    return grouped;
  }
}
