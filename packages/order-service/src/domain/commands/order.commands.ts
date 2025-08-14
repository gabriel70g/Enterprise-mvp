import { randomUUID } from 'crypto';

export abstract class BaseCommand {
  public readonly id: string;
  public readonly correlationId: string;

  constructor(correlationId: string) {
    this.id = randomUUID();
    this.correlationId = correlationId;
  }
}

export class CreateOrderCommand extends BaseCommand {
  constructor(
    correlationId: string,
    public readonly customerId: string,
    public readonly items: Array<{ productId: string; quantity: number; price: number }>
  ) {
    super(correlationId);
  }
}

export class ConfirmOrderCommand extends BaseCommand {
  constructor(
    correlationId: string,
    public readonly orderId: string
  ) {
    super(correlationId);
  }
}

export class CancelOrderCommand extends BaseCommand {
  constructor(
    correlationId: string,
    public readonly orderId: string,
    public readonly reason: string
  ) {
    super(correlationId);
  }
}
