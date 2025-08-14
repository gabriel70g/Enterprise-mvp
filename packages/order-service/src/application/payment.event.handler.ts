import { EventStore } from '../infrastructure/event-store';
import { Order } from '../domain/order.aggregate';
import { ConfirmOrderCommand } from '../domain/commands/order.commands';

export class PaymentConfirmedHandler {
  constructor(private eventStore: EventStore) {}

  async handle(event: any): Promise<void> {
    console.log(`Processing PaymentConfirmedEvent for order confirmation: ${event.orderId}`);
    
    // Confirmar la orden automáticamente después del pago confirmado
    const confirmCommand = new ConfirmOrderCommand(
      event.orderId,
      event.correlationId
    );
    
    // En un MVP real, aquí cargaríamos la orden del event store
    // Para MVP: solo logs para demostrar el flujo
    console.log(`✅ Payment confirmed for order ${event.orderId}: $${event.amount}`);
    console.log(`🎯 Order ${event.orderId} automatically confirmed!`);
    console.log(`📦 Stock confirmed in transit for order ${event.orderId}`);
    console.log(`🚚 Ready to notify delivery service`);
    
    // Aquí podríamos disparar un OrderConfirmedEvent para que el inventory service lo escuche
    // Por ahora solo logs para el MVP
  }
}
