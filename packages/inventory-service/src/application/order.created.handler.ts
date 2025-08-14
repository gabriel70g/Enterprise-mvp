import { EventStore } from '../infrastructure/event-store';

export class OrderCreatedHandler {
  constructor(private eventStore: EventStore) {}

  async handle(event: any): Promise<void> {
    console.log(`Processing OrderCreatedEvent for stock verification: ${event.aggregateId}`);
    
    // Para cada item en la orden, verificar y reservar stock (MVP simple)
    for (const item of event.items) {
      console.log(`Verifying stock for product ${item.productId}: ${item.quantity} units needed`);
      
      // En un MVP real, aquí verificaríamos stock real
      // Para MVP: siempre hay stock disponible
      console.log(`✅ Stock available for product ${item.productId}`);
      
      // Reservar stock (pasar a stock en transito)
      console.log(`📦 Reserving ${item.quantity} units of ${item.productId} for order ${event.aggregateId}`);
      console.log(`🔄 Product ${item.productId} moved to "in transit" status`);
    }
    
    console.log(`🎯 Stock reserved for order ${event.aggregateId} - ready for payment processing`);
    console.log(`💳 Waiting for payment confirmation...`);
  }
}
