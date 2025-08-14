import { randomUUID } from 'crypto';

export abstract class BaseCommand {
  public readonly id: string;
  public readonly correlationId: string;

  constructor(correlationId: string) {
    this.id = randomUUID();
    this.correlationId = correlationId;
  }
}

export class ReserveProductCommand extends BaseCommand {
  constructor(
    correlationId: string,
    public readonly orderId: string,
    public readonly productId: string,
    public readonly quantity: number
  ) {
    super(correlationId);
  }
}

export class ReleaseProductCommand extends BaseCommand {
  constructor(
    correlationId: string,
    public readonly orderId: string,
    public readonly productId: string,
    public readonly quantity: number
  ) {
    super(correlationId);
  }
}

export class UpdateInventoryCommand extends BaseCommand {
  constructor(
    correlationId: string,
    public readonly productId: string,
    public readonly quantity: number
  ) {
    super(correlationId);
  }
}

export class CreateInventoryCommand {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly name: string,
    public readonly description: string,
    public readonly availableQuantity: number,
    public readonly minStockLevel: number,
    public readonly category: string,
    public readonly correlationId: string
  ) {}
}

export class ReserveStockCommand {
  constructor(
    public readonly inventoryId: string,
    public readonly orderId: string,
    public readonly productId: string,
    public readonly quantity: number,
    public readonly correlationId: string
  ) {}
}

export class ReleaseStockCommand {
  constructor(
    public readonly inventoryId: string,
    public readonly orderId: string,
    public readonly productId: string,
    public readonly quantity: number,
    public readonly correlationId: string
  ) {}
}

export class MoveToInTransitCommand {
  constructor(
    public readonly inventoryId: string,
    public readonly orderId: string,
    public readonly productId: string,
    public readonly quantity: number,
    public readonly correlationId: string
  ) {}
}

export class UpdateStockCommand {
  constructor(
    public readonly inventoryId: string,
    public readonly productId: string,
    public readonly newAvailableQuantity: number,
    public readonly correlationId: string
  ) {}
}

export class DeactivateInventoryCommand {
  constructor(
    public readonly inventoryId: string,
    public readonly correlationId: string
  ) {}
}

export class ActivateInventoryCommand {
  constructor(
    public readonly inventoryId: string,
    public readonly correlationId: string
  ) {}
}
