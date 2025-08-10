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
