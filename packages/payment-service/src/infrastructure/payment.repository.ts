import { Payment } from '../domain/payment.aggregate';
import { EventStore, StoredEvent } from './event-store';

export interface PaymentRepository {
  save(payment: Payment): Promise<void>;
  findById(id: string): Promise<Payment | null>;
  findByOrderId(orderId: string): Promise<Payment | null>;
  findByCorrelationId(correlationId: string): Promise<Payment | null>;
  findAll(): Promise<Payment[]>;
  findPending(): Promise<Payment[]>;
  findConfirmed(): Promise<Payment[]>;
  findFailed(): Promise<Payment[]>;
}

export class EventSourcedPaymentRepository implements PaymentRepository {
  private readonly SNAPSHOT_INTERVAL = 10; // Crear snapshot cada 10 eventos

  constructor(private eventStore: EventStore) {}

  async save(payment: Payment): Promise<void> {
    const events = payment.uncommittedEvents;
    if (events.length === 0) return;

    // Obtener versión actual del agregado
    const currentEvents = await this.eventStore.getEvents(payment.id);
    const expectedVersion = currentEvents.length;

    // Guardar eventos con control de concurrencia
    await this.eventStore.appendEvents(payment.id, events, expectedVersion);

    // Crear snapshot si es necesario
    if (this.shouldCreateSnapshot(currentEvents.length + events.length)) {
      await this.eventStore.createSnapshot(payment.id, payment.toSnapshot(), payment.version);
    }

    // Marcar eventos como committeados
    payment.markEventsAsCommitted();
  }

  async findById(id: string): Promise<Payment | null> {
    try {
      // Intentar obtener snapshot más reciente
      const snapshot = await this.eventStore.getLatestSnapshot(id);
      
      let events: StoredEvent[] = [];
      
      if (snapshot) {
        // Obtener eventos posteriores al snapshot
        events = await this.eventStore.getEvents(id, snapshot.version);
        return Payment.fromSnapshot(snapshot.data, events);
      } else {
        // Reconstruir completamente desde eventos
        events = await this.eventStore.getEvents(id);
        if (events.length === 0) return null;
        
        return Payment.fromEvents(events);
      }
    } catch (error) {
      console.error(`Error finding payment by id ${id}:`, error);
      return null;
    }
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    try {
      // Buscar eventos de PaymentProcessedEvent para la orden
      const events = await this.eventStore.getEventsByType('PaymentProcessedEvent');
      const paymentEvent = events.find(event => event.data.orderId === orderId);
      
      if (!paymentEvent) return null;
      
      return this.findById(paymentEvent.aggregateId);
    } catch (error) {
      console.error(`Error finding payment by orderId ${orderId}:`, error);
      return null;
    }
  }

  async findByCorrelationId(correlationId: string): Promise<Payment | null> {
    try {
      const events = await this.eventStore.getEventsByCorrelationId(correlationId);
      if (events.length === 0) return null;

      // Agrupar eventos por aggregateId
      const eventsByAggregate = this.groupEventsByAggregate(events);
      
      // Tomar el primer agregado (asumiendo que correlationId es único por pago)
      const firstEntry = eventsByAggregate.entries().next();
      if (!firstEntry.done) {
        const [aggregateId, aggregateEvents] = firstEntry.value;
        return this.findById(aggregateId);
      }
      
      return null;
    } catch (error) {
      console.error(`Error finding payment by correlationId ${correlationId}:`, error);
      return null;
    }
  }

  async findAll(): Promise<Payment[]> {
    try {
      // Obtener todos los eventos de pagos
      const paymentEvents = await this.eventStore.getEventsByType('PaymentProcessedEvent');
      
      const payments: Payment[] = [];
      for (const event of paymentEvents) {
        const payment = await this.findById(event.aggregateId);
        if (payment) payments.push(payment);
      }
      
      return payments;
    } catch (error) {
      console.error('Error finding all payments:', error);
      return [];
    }
  }

  async findPending(): Promise<Payment[]> {
    try {
      const allPayments = await this.findAll();
      return allPayments.filter(payment => payment.status === 'pending');
    } catch (error) {
      console.error('Error finding pending payments:', error);
      return [];
    }
  }

  async findConfirmed(): Promise<Payment[]> {
    try {
      const allPayments = await this.findAll();
      return allPayments.filter(payment => payment.status === 'confirmed');
    } catch (error) {
      console.error('Error finding confirmed payments:', error);
      return [];
    }
  }

  async findFailed(): Promise<Payment[]> {
    try {
      const allPayments = await this.findAll();
      return allPayments.filter(payment => payment.status === 'failed');
    } catch (error) {
      console.error('Error finding failed payments:', error);
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
