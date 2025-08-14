import { BaseDomainEvent } from './events/base.event';
import { PaymentProcessedEvent, PaymentConfirmedEvent, PaymentFailedEvent } from './events/payment.events';

export interface PaymentInfo {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'confirmed' | 'failed';
  paymentMethod: string;
  customerId: string;
  correlationId: string;
  createdAt: Date;
  processedAt?: Date;
  confirmedAt?: Date;
  failedAt?: Date;
  failureReason?: string;
}

export class Payment {
  private _id: string;
  private _orderId: string;
  private _amount: number;
  private _currency: string;
  private _status: 'pending' | 'processing' | 'confirmed' | 'failed';
  private _paymentMethod: string;
  private _customerId: string;
  private _correlationId: string;
  private _createdAt: Date;
  private _processedAt?: Date;
  private _confirmedAt?: Date;
  private _failedAt?: Date;
  private _failureReason?: string;
  private _version: number = 0;
  private _uncommittedEvents: BaseDomainEvent[] = [];

  constructor(
    id: string,
    orderId: string,
    amount: number,
    currency: string,
    paymentMethod: string,
    customerId: string,
    correlationId: string
  ) {
    this._id = id;
    this._orderId = orderId;
    this._amount = amount;
    this._currency = currency;
    this._status = 'pending';
    this._paymentMethod = paymentMethod;
    this._customerId = customerId;
    this._correlationId = correlationId;
    this._createdAt = new Date();
  }

  // Factory method para reconstruir desde eventos
  static fromEvents(events: any[]): Payment {
    if (events.length === 0) {
      throw new Error('Cannot reconstruct payment from empty event stream');
    }

    const payment = new (Payment as any)();
    payment._uncommittedEvents = [];
    
    for (const event of events) {
      payment.applyEvent(event);
      payment._version++;
    }

    return payment;
  }

  // Factory method para reconstruir desde snapshot + eventos
  static fromSnapshot(snapshot: any, events: any[]): Payment {
    const payment = new (Payment as any)();
    payment._id = snapshot.id;
    payment._orderId = snapshot.orderId;
    payment._amount = snapshot.amount;
    payment._currency = snapshot.currency;
    payment._status = snapshot.status;
    payment._paymentMethod = snapshot.paymentMethod;
    payment._customerId = snapshot.customerId;
    payment._correlationId = snapshot.correlationId;
    payment._createdAt = new Date(snapshot.createdAt);
    payment._processedAt = snapshot.processedAt ? new Date(snapshot.processedAt) : undefined;
    payment._confirmedAt = snapshot.confirmedAt ? new Date(snapshot.confirmedAt) : undefined;
    payment._failedAt = snapshot.failedAt ? new Date(snapshot.failedAt) : undefined;
    payment._failureReason = snapshot.failureReason;
    payment._version = snapshot.version;
    payment._uncommittedEvents = [];

    // Aplicar eventos posteriores al snapshot
    for (const event of events) {
      payment.applyEvent(event);
      payment._version++;
    }

    return payment;
  }

  // Métodos de negocio
  process(): void {
    if (this._status !== 'pending') {
      throw new Error(`Cannot process payment in status: ${this._status}`);
    }

    this._status = 'processing';
    this._processedAt = new Date();
    this.apply(new PaymentProcessedEvent(this._id, this._orderId, this._amount, this._correlationId));
  }

  confirm(): void {
    if (this._status !== 'processing') {
      throw new Error(`Cannot confirm payment in status: ${this._status}`);
    }

    this._status = 'confirmed';
    this._confirmedAt = new Date();
    this.apply(new PaymentConfirmedEvent(this._id, this._orderId, this._amount, this._correlationId));
  }

  fail(reason: string): void {
    if (this._status === 'failed') {
      throw new Error('Payment is already failed');
    }

    this._status = 'failed';
    this._failedAt = new Date();
    this._failureReason = reason;
    this.apply(new PaymentFailedEvent(this._id, reason, this._correlationId));
  }

  // Getters
  get id(): string { return this._id; }
  get orderId(): string { return this._orderId; }
  get amount(): number { return this._amount; }
  get currency(): string { return this._currency; }
  get status(): string { return this._status; }
  get paymentMethod(): string { return this._paymentMethod; }
  get customerId(): string { return this._customerId; }
  get correlationId(): string { return this._correlationId; }
  get createdAt(): Date { return this._createdAt; }
  get processedAt(): Date | undefined { return this._processedAt; }
  get confirmedAt(): Date | undefined { return this._confirmedAt; }
  get failedAt(): Date | undefined { return this._failedAt; }
  get failureReason(): string | undefined { return this._failureReason; }
  get version(): number { return this._version; }
  get uncommittedEvents(): BaseDomainEvent[] { return [...this._uncommittedEvents]; }

  // Métodos de Event Sourcing
  private apply(event: BaseDomainEvent): void {
    this.applyEvent(event);
    this._uncommittedEvents.push(event);
  }

  private applyEvent(event: any): void {
    switch (event.constructor.name) {
      case 'PaymentProcessedEvent':
        this._status = 'processing';
        this._processedAt = new Date(event.timestamp);
        break;

      case 'PaymentConfirmedEvent':
        this._status = 'confirmed';
        this._confirmedAt = new Date(event.timestamp);
        break;

      case 'PaymentFailedEvent':
        this._status = 'failed';
        this._failedAt = new Date(event.timestamp);
        this._failureReason = event.reason;
        break;

      default:
        throw new Error(`Unknown event type: ${event.constructor.name}`);
    }
  }

  markEventsAsCommitted(): void {
    this._uncommittedEvents = [];
  }

  // Método para crear snapshot
  toSnapshot(): PaymentInfo {
    return {
      id: this._id,
      orderId: this._orderId,
      amount: this._amount,
      currency: this._currency,
      status: this._status,
      paymentMethod: this._paymentMethod,
      customerId: this._customerId,
      correlationId: this._correlationId,
      createdAt: this._createdAt,
      processedAt: this._processedAt,
      confirmedAt: this._confirmedAt,
      failedAt: this._failedAt,
      failureReason: this._failureReason,
    };
  }
}
