import { CommandHandler } from './command-bus';
import { EventStore } from '../infrastructure/event-store';
import { Order } from '../domain/order.aggregate';
import { CreateOrderCommand, ConfirmOrderCommand, CancelOrderCommand } from '../domain/commands/order.commands';

export class CreateOrderHandler implements CommandHandler<CreateOrderCommand> {
  constructor(private eventStore: EventStore) {}

  async handle(command: CreateOrderCommand): Promise<void> {
    const order = Order.create(command);
    await this.eventStore.appendEvents(order.id, order.uncommittedEvents);
    order.markEventsAsCommitted();
  }
}

export class ConfirmOrderHandler implements CommandHandler<ConfirmOrderCommand> {
  constructor(private eventStore: EventStore) {}

  async handle(command: ConfirmOrderCommand): Promise<void> {
    // In a real implementation, we would load the order from event store
    // For now, we'll create a simple order and confirm it
    const order = new Order();
    order.confirm(command);
    await this.eventStore.appendEvents(command.orderId, order.uncommittedEvents);
    order.markEventsAsCommitted();
  }
}

export class CancelOrderHandler implements CommandHandler<CancelOrderCommand> {
  constructor(private eventStore: EventStore) {}

  async handle(command: CancelOrderCommand): Promise<void> {
    // In a real implementation, we would load the order from event store
    // For now, we'll create a simple order and cancel it
    const order = new Order();
    order.cancel(command);
    await this.eventStore.appendEvents(command.orderId, order.uncommittedEvents);
    order.markEventsAsCommitted();
  }
}
