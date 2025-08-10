import { PaymentInitiatedEvent, PaymentProcessedEvent, PaymentFailedEvent } from './events/payment.events';
import { ProcessPaymentCommand, CancelPaymentCommand } from './commands/payment.commands';

export enum PaymentStatus {
  INITIATED = 'initiated',
  PROCESSED = 'processed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export class Payment {
  private _id: string;
  private _status: PaymentStatus;
  private _orderId: string;
  private _amount: number;
  private _uncommittedEvents: any[] = [];

  constructor() {
    this._id = '';
    this._status = PaymentStatus.INITIATED;
    this._orderId = '';
    this._amount = 0;
  }

  get id(): string { return this._id; }
  get status(): PaymentStatus { return this._status; }
  get orderId(): string { return this._orderId; }
  get amount(): number { return this._amount; }
  get uncommittedEvents(): any[] { return this._uncommittedEvents; }

  static process(command: ProcessPaymentCommand): Payment {
    const payment = new Payment();
    payment._id = command.id;
    payment._orderId = command.orderId;
    payment._amount = command.amount;
    
    payment.apply(new PaymentInitiatedEvent(
      payment._id,
      command.orderId,
      command.amount,
      command.correlationId
    ));

    // Simulate payment processing
    payment._status = PaymentStatus.PROCESSED;
    payment.apply(new PaymentProcessedEvent(
      payment._id,
      command.orderId,
      command.amount,
      command.correlationId
    ));

    return payment;
  }

  cancel(command: CancelPaymentCommand): void {
    if (this._status === PaymentStatus.CANCELLED) {
      throw new Error('Payment is already cancelled');
    }

    this._status = PaymentStatus.CANCELLED;
    this.apply(new PaymentFailedEvent(
      this._id,
      this._orderId,
      command.reason,
      command.correlationId
    ));
  }

  private apply(event: any): void {
    this._uncommittedEvents.push(event);
  }

  markEventsAsCommitted(): void {
    this._uncommittedEvents = [];
  }
}
