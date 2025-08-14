import { Order } from '../domain/order.aggregate';
import { EventStore, StoredEvent } from './event-store';

export interface OrderRepository {
  save(order: Order): Promise<void>;
  findById(id: string): Promise<Order | null>;
  findByCorrelationId(correlationId: string): Promise<Order | null>;
  findAll(): Promise<Order[]>;
  findPending(): Promise<Order[]>;
  findConfirmed(): Promise<Order[]>;
}

export class EventSourcedOrderRepository implements OrderRepository {
  private readonly SNAPSHOT_INTERVAL = 10; // Crear snapshot cada 10 eventos

  constructor(private eventStore: EventStore) {}

  async save(order: Order): Promise<void> {
    const events = order.uncommittedEvents;
    if (events.length === 0) return;

    // Obtener versión actual del agregado
    const currentEvents = await this.eventStore.getEvents(order.id);
    const expectedVersion = currentEvents.length;

    // Guardar eventos con control de concurrencia
    await this.eventStore.appendEvents(order.id, events, expectedVersion);

    // Crear snapshot si es necesario
    if (this.shouldCreateSnapshot(currentEvents.length + events.length)) {
      await this.eventStore.createSnapshot(order.id, order.toSnapshot(), order.version);
    }

    // Marcar eventos como committeados
    order.markEventsAsCommitted();
  }

  async findById(id: string): Promise<Order | null> {
    try {
      // Intentar obtener snapshot más reciente
      const snapshot = await this.eventStore.getLatestSnapshot(id);
      
      let events: StoredEvent[] = [];
      
      if (snapshot) {
        // Obtener eventos posteriores al snapshot
        events = await this.eventStore.getEvents(id, snapshot.version);
        return Order.fromSnapshot(snapshot.data, events);
      } else {
        // Reconstruir completamente desde eventos
        events = await this.eventStore.getEvents(id);
        if (events.length === 0) return null;
        
        return Order.fromEvents(events);
      }
    } catch (error) {
      console.error(`Error finding order by id ${id}:`, error);
      return null;
    }
  }

  async findByCorrelationId(correlationId: string): Promise<Order | null> {
    try {
      const events = await this.eventStore.getEventsByCorrelationId(correlationId);
      if (events.length === 0) return null;

      // Agrupar eventos por aggregateId
      const eventsByAggregate = this.groupEventsByAggregate(events);
      
      // Tomar el primer agregado (asumiendo que correlationId es único por orden)
      const firstEntry = eventsByAggregate.entries().next();
      if (!firstEntry.done) {
        const [aggregateId, aggregateEvents] = firstEntry.value;
        return this.findById(aggregateId);
      }
      
      return null;
    } catch (error) {
      console.error(`Error finding order by correlationId ${correlationId}:`, error);
      return null;
    }
  }

  async findAll(): Promise<Order[]> {
    try {
      // Obtener todos los eventos de órdenes
      const orderEvents = await this.eventStore.getEventsByType('OrderCreatedEvent');
      
      const orders: Order[] = [];
      for (const event of orderEvents) {
        const order = await this.findById(event.aggregateId);
        if (order) orders.push(order);
      }
      
      return orders;
    } catch (error) {
      console.error('Error finding all orders:', error);
      return [];
    }
  }

  async findPending(): Promise<Order[]> {
    try {
      const allOrders = await this.findAll();
      return allOrders.filter(order => order.status === 'created');
    } catch (error) {
      console.error('Error finding pending orders:', error);
      return [];
    }
  }

  async findConfirmed(): Promise<Order[]> {
    try {
      const allOrders = await this.findAll();
      return allOrders.filter(order => order.status === 'confirmed');
    } catch (error) {
      console.error('Error finding confirmed orders:', error);
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
