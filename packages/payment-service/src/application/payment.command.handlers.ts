import { CommandHandler } from './command-bus';
import { EventStore } from '../infrastructure/event-store';
import { Payment } from '../domain/payment.aggregate';
import { ProcessPaymentCommand, CancelPaymentCommand } from '../domain/commands/payment.commands';

export class ProcessPaymentHandler implements CommandHandler<ProcessPaymentCommand> {
  constructor(private eventStore: EventStore) {}

  async handle(command: ProcessPaymentCommand): Promise<void> {
    const payment = Payment.process(command);
    await this.eventStore.appendEvents(payment.id, payment.uncommittedEvents);
    payment.markEventsAsCommitted();
  }
}

export class CancelPaymentHandler implements CommandHandler<CancelPaymentCommand> {
  constructor(private eventStore: EventStore) {}

  async handle(command: CancelPaymentCommand): Promise<void> {
    // In a real implementation, we would load the payment from event store
    // For now, we'll create a simple payment and cancel it
    const payment = new Payment();
    payment.cancel(command);
    await this.eventStore.appendEvents(command.orderId, payment.uncommittedEvents);
    payment.markEventsAsCommitted();
  }
}
