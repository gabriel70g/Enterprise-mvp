import { CommandHandler } from './command-bus';
import { EventStore } from '../infrastructure/event-store';
import { Inventory } from '../domain/inventory.aggregate';
import { ReserveProductCommand, ReleaseProductCommand, UpdateInventoryCommand } from '../domain/commands/inventory.commands';

export class ReserveProductHandler implements CommandHandler<ReserveProductCommand> {
  constructor(private eventStore: EventStore) {}

  async handle(command: ReserveProductCommand): Promise<void> {
    // In a real implementation, we would load the inventory from event store
    // For now, we'll create a simple inventory with enough quantity
    const inventory = new Inventory();
    inventory.setInitialState(
      command.productId,
      command.productId,
      command.quantity + 10, // Ensure we have enough
      0
    );
    
    inventory.reserve(command);
    await this.eventStore.appendEvents(inventory.id, inventory.uncommittedEvents);
    inventory.markEventsAsCommitted();
  }
}

export class ReleaseProductHandler implements CommandHandler<ReleaseProductCommand> {
  constructor(private eventStore: EventStore) {}

  async handle(command: ReleaseProductCommand): Promise<void> {
    // In a real implementation, we would load the inventory from event store
    const inventory = new Inventory();
    inventory.setInitialState(
      command.productId,
      command.productId,
      0, // No available quantity initially
      command.quantity // Ensure we have enough reserved
    );
    
    inventory.release(command);
    await this.eventStore.appendEvents(inventory.id, inventory.uncommittedEvents);
    inventory.markEventsAsCommitted();
  }
}

export class UpdateInventoryHandler implements CommandHandler<UpdateInventoryCommand> {
  constructor(private eventStore: EventStore) {}

  async handle(command: UpdateInventoryCommand): Promise<void> {
    const inventory = Inventory.create(command);
    await this.eventStore.appendEvents(inventory.id, inventory.uncommittedEvents);
    inventory.markEventsAsCommitted();
  }
}
