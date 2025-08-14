import { CommandHandler } from './command-bus';
import { InventoryRepository } from '../infrastructure/inventory.repository';
import { Inventory } from '../domain/inventory.aggregate';
import {
  CreateInventoryCommand,
  ReserveStockCommand,
  ReleaseStockCommand,
  MoveToInTransitCommand,
  UpdateStockCommand,
  DeactivateInventoryCommand,
  ActivateInventoryCommand
} from '../domain/commands/inventory.commands';

export class CreateInventoryHandler implements CommandHandler<CreateInventoryCommand> {
  constructor(private inventoryRepository: InventoryRepository) {}

  async handle(command: CreateInventoryCommand): Promise<void> {
    const inventory = new Inventory(
      command.id,
      command.productId,
      command.name,
      command.description,
      command.availableQuantity,
      command.minStockLevel,
      command.category
    );

    // Establecer correlationId para el agregado
    inventory.setCorrelationId(command.correlationId);

    await this.inventoryRepository.save(inventory);
  }
}

export class ReserveStockHandler implements CommandHandler<ReserveStockCommand> {
  constructor(private inventoryRepository: InventoryRepository) {}

  async handle(command: ReserveStockCommand): Promise<void> {
    const inventory = await this.inventoryRepository.findById(command.inventoryId);
    if (!inventory) {
      throw new Error(`Inventory not found: ${command.inventoryId}`);
    }

    // Establecer correlationId para el agregado
    inventory.setCorrelationId(command.correlationId);

    inventory.reserveStock(command.orderId, command.quantity);
    await this.inventoryRepository.save(inventory);
  }
}

export class ReleaseStockHandler implements CommandHandler<ReleaseStockCommand> {
  constructor(private inventoryRepository: InventoryRepository) {}

  async handle(command: ReleaseStockCommand): Promise<void> {
    const inventory = await this.inventoryRepository.findById(command.inventoryId);
    if (!inventory) {
      throw new Error(`Inventory not found: ${command.inventoryId}`);
    }

    // Establecer correlationId para el agregado
    inventory.setCorrelationId(command.correlationId);

    inventory.releaseStock(command.orderId, command.quantity);
    await this.inventoryRepository.save(inventory);
  }
}

export class MoveToInTransitHandler implements CommandHandler<MoveToInTransitCommand> {
  constructor(private inventoryRepository: InventoryRepository) {}

  async handle(command: MoveToInTransitCommand): Promise<void> {
    const inventory = await this.inventoryRepository.findById(command.inventoryId);
    if (!inventory) {
      throw new Error(`Inventory not found: ${command.inventoryId}`);
    }

    // Establecer correlationId para el agregado
    inventory.setCorrelationId(command.correlationId);

    inventory.moveToInTransit(command.orderId, command.quantity);
    await this.inventoryRepository.save(inventory);
  }
}

export class UpdateStockHandler implements CommandHandler<UpdateStockCommand> {
  constructor(private inventoryRepository: InventoryRepository) {}

  async handle(command: UpdateStockCommand): Promise<void> {
    const inventory = await this.inventoryRepository.findById(command.inventoryId);
    if (!inventory) {
      throw new Error(`Inventory not found: ${command.inventoryId}`);
    }

    // Establecer correlationId para el agregado
    inventory.setCorrelationId(command.correlationId);

    inventory.updateStock(command.newAvailableQuantity);
    await this.inventoryRepository.save(inventory);
  }
}

export class DeactivateInventoryHandler implements CommandHandler<DeactivateInventoryCommand> {
  constructor(private inventoryRepository: InventoryRepository) {}

  async handle(command: DeactivateInventoryCommand): Promise<void> {
    const inventory = await this.inventoryRepository.findById(command.inventoryId);
    if (!inventory) {
      throw new Error(`Inventory not found: ${command.inventoryId}`);
    }

    // Establecer correlationId para el agregado
    inventory.setCorrelationId(command.correlationId);

    inventory.deactivate();
    await this.inventoryRepository.save(inventory);
  }
}

export class ActivateInventoryHandler implements CommandHandler<ActivateInventoryCommand> {
  constructor(private inventoryRepository: InventoryRepository) {}

  async handle(command: ActivateInventoryCommand): Promise<void> {
    const inventory = await this.inventoryRepository.findById(command.inventoryId);
    if (!inventory) {
      throw new Error(`Inventory not found: ${command.inventoryId}`);
    }

    // Establecer correlationId para el agregado
    inventory.setCorrelationId(command.correlationId);

    inventory.activate();
    await this.inventoryRepository.save(inventory);
  }
}
