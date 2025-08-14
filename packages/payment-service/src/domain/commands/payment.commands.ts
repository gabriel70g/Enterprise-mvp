import { randomUUID } from 'crypto';

export abstract class BaseCommand {
  public readonly id: string;
  public readonly correlationId: string;

  constructor(correlationId: string) {
    this.id = randomUUID();
    this.correlationId = correlationId;
  }
}

export class ProcessPaymentCommand extends BaseCommand {
  constructor(
    correlationId: string,
    public readonly orderId: string,
    public readonly amount: number,
    public readonly customerId?: string
  ) {
    super(correlationId);
  }
}

export class CancelPaymentCommand extends BaseCommand {
  constructor(
    correlationId: string,
    public readonly paymentId: string,
    public readonly reason: string
  ) {
    super(correlationId);
  }
}
