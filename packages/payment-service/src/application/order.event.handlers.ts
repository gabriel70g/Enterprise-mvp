import { EventStore } from '../infrastructure/event-store';
import { Payment } from '../domain/payment.aggregate';
import { ProcessPaymentCommand } from '../domain/commands/payment.commands';

export class OrderConfirmedEventHandler {
  constructor(private eventStore: EventStore) {}

  async handle(event: any): Promise<void> {
    console.log(`Processing OrderConfirmedEvent for payment: ${event.aggregateId}`);
    
    // Procesar el pago automáticamente (MVP simple)
    const processPaymentCommand = new ProcessPaymentCommand(
      event.correlationId,
      event.aggregateId, // orderId
      event.totalAmount || 100, // amount (fallback para MVP)
      event.customerId // customerId
    );
    
    // Crear nuevo pago
    const payment = new Payment(
      processPaymentCommand.id,
      processPaymentCommand.orderId,
      processPaymentCommand.amount,
      'USD', // Moneda por defecto
      'credit_card', // Método de pago por defecto
      processPaymentCommand.customerId || 'unknown',
      processPaymentCommand.correlationId
    );

    // Procesar el pago
    payment.process();
    
    await this.eventStore.appendEvents(payment.id, payment.uncommittedEvents);
    payment.markEventsAsCommitted();
    
    console.log(`✅ Payment processed for order ${event.aggregateId}: $${event.totalAmount || 100}`);
    console.log(`🎯 Order ${event.aggregateId} ready for inventory update!`);
  }
}
