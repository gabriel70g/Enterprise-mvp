import { ProductReservedEvent, ProductReleasedEvent, InventoryUpdatedEvent } from './events/inventory.events';
import { ReserveProductCommand, ReleaseProductCommand, UpdateInventoryCommand } from './commands/inventory.commands';

export class Inventory {
  private _id: string;
  private _productId: string;
  private _availableQuantity: number;
  private _reservedQuantity: number;
  private _uncommittedEvents: any[] = [];

  constructor() {
    this._id = '';
    this._productId = '';
    this._availableQuantity = 0;
    this._reservedQuantity = 0;
  }

  get id(): string { return this._id; }
  get productId(): string { return this._productId; }
  get availableQuantity(): number { return this._availableQuantity; }
  get reservedQuantity(): number { return this._reservedQuantity; }
  get uncommittedEvents(): any[] { return this._uncommittedEvents; }

  // Public methods to set initial state
  setInitialState(id: string, productId: string, availableQuantity: number, reservedQuantity: number = 0): void {
    this._id = id;
    this._productId = productId;
    this._availableQuantity = availableQuantity;
    this._reservedQuantity = reservedQuantity;
  }

  static create(command: UpdateInventoryCommand): Inventory {
    const inventory = new Inventory();
    inventory._id = command.id;
    inventory._productId = command.productId;
    inventory._availableQuantity = command.quantity;
    
    inventory.apply(new InventoryUpdatedEvent(
      inventory._id,
      command.productId,
      command.quantity,
      command.correlationId
    ));

    return inventory;
  }

  reserve(command: ReserveProductCommand): void {
    if (this._availableQuantity < command.quantity) {
      throw new Error(`Insufficient inventory. Available: ${this._availableQuantity}, Requested: ${command.quantity}`);
    }

    this._availableQuantity -= command.quantity;
    this._reservedQuantity += command.quantity;

    this.apply(new ProductReservedEvent(
      this._id,
      command.orderId,
      command.productId,
      command.quantity,
      command.correlationId
    ));

    this.apply(new InventoryUpdatedEvent(
      this._id,
      this._productId,
      this._availableQuantity,
      command.correlationId
    ));
  }

  release(command: ReleaseProductCommand): void {
    if (this._reservedQuantity < command.quantity) {
      throw new Error(`Cannot release more than reserved. Reserved: ${this._reservedQuantity}, Requested: ${command.quantity}`);
    }

    this._reservedQuantity -= command.quantity;
    this._availableQuantity += command.quantity;

    this.apply(new ProductReleasedEvent(
      this._id,
      command.orderId,
      command.productId,
      command.quantity,
      command.correlationId
    ));

    this.apply(new InventoryUpdatedEvent(
      this._id,
      this._productId,
      this._availableQuantity,
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
