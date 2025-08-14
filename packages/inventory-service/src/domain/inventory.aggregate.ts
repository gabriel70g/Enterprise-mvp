import { BaseDomainEvent } from './events/base.event';
import { StockReservedEvent, StockReleasedEvent, InventoryUpdatedEvent, StockReadyForDeliveryEvent } from './events/inventory.events';

export interface InventoryItem {
  productId: string;
  name: string;
  description: string;
  availableQuantity: number;
  reservedQuantity: number;
  inTransitQuantity: number;
  minStockLevel: number;
  category: string;
  isActive: boolean;
}

export interface InventoryState {
  id: string;
  productId: string;
  name: string;
  description: string;
  availableQuantity: number;
  reservedQuantity: number;
  inTransitQuantity: number;
  minStockLevel: number;
  category: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Inventory {
  private _id: string;
  private _productId: string;
  private _name: string;
  private _description: string;
  private _availableQuantity: number;
  private _reservedQuantity: number;
  private _inTransitQuantity: number;
  private _minStockLevel: number;
  private _category: string;
  private _isActive: boolean;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _version: number = 0;
  private _correlationId?: string;
  private _uncommittedEvents: BaseDomainEvent[] = [];

  constructor(
    id: string,
    productId: string,
    name: string,
    description: string,
    availableQuantity: number,
    minStockLevel: number,
    category: string
  ) {
    this._id = id;
    this._productId = productId;
    this._name = name;
    this._description = description;
    this._availableQuantity = availableQuantity;
    this._reservedQuantity = 0;
    this._inTransitQuantity = 0;
    this._minStockLevel = minStockLevel;
    this._category = category;
    this._isActive = true;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  // Factory method para reconstruir desde eventos
  static fromEvents(events: any[]): Inventory {
    if (events.length === 0) {
      throw new Error('Cannot reconstruct inventory from empty event stream');
    }

    const inventory = new (Inventory as any)();
    inventory._uncommittedEvents = [];
    
    for (const event of events) {
      inventory.applyEvent(event);
      inventory._version++;
    }

    return inventory;
  }

  // Factory method para reconstruir desde snapshot + eventos
  static fromSnapshot(snapshot: any, events: any[]): Inventory {
    const inventory = new (Inventory as any)();
    inventory._id = snapshot.id;
    inventory._productId = snapshot.productId;
    inventory._name = snapshot.name;
    inventory._description = snapshot.description;
    inventory._availableQuantity = snapshot.availableQuantity;
    inventory._reservedQuantity = snapshot.reservedQuantity;
    inventory._inTransitQuantity = snapshot.inTransitQuantity;
    inventory._minStockLevel = snapshot.minStockLevel;
    inventory._category = snapshot.category;
    inventory._isActive = snapshot.isActive;
    inventory._createdAt = new Date(snapshot.createdAt);
    inventory._updatedAt = new Date(snapshot.updatedAt);
    inventory._version = snapshot.version;
    inventory._uncommittedEvents = [];

    // Aplicar eventos posteriores al snapshot
    for (const event of events) {
      inventory.applyEvent(event);
      inventory._version++;
    }

    return inventory;
  }

  // Métodos de negocio
  reserveStock(orderId: string, quantity: number): void {
    if (!this._isActive) {
      throw new Error(`Cannot reserve stock for inactive product: ${this._productId}`);
    }

    if (this._availableQuantity < quantity) {
      throw new Error(`Insufficient stock for product ${this._productId}. Available: ${this._availableQuantity}, Requested: ${quantity}`);
    }

    this._availableQuantity -= quantity;
    this._reservedQuantity += quantity;
    this._updatedAt = new Date();

    this.apply(new StockReservedEvent(this._id, orderId, this._productId, quantity, this._correlationId || 'unknown'));
  }

  releaseStock(orderId: string, quantity: number): void {
    if (this._reservedQuantity < quantity) {
      throw new Error(`Cannot release more stock than reserved for product ${this._productId}. Reserved: ${this._reservedQuantity}, Requested: ${quantity}`);
    }

    this._reservedQuantity -= quantity;
    this._availableQuantity += quantity;
    this._updatedAt = new Date();

    this.apply(new StockReleasedEvent(this._id, orderId, this._productId, quantity, this._correlationId || 'unknown'));
  }

  moveToInTransit(orderId: string, quantity: number): void {
    if (this._reservedQuantity < quantity) {
      throw new Error(`Cannot move to in-transit more stock than reserved for product ${this._productId}. Reserved: ${this._reservedQuantity}, Requested: ${quantity}`);
    }

    this._reservedQuantity -= quantity;
    this._inTransitQuantity += quantity;
    this._updatedAt = new Date();

    this.apply(new StockReadyForDeliveryEvent(this._id, orderId, this._productId, quantity, this._correlationId || 'unknown'));
  }

  updateStock(newAvailableQuantity: number): void {
    if (newAvailableQuantity < 0) {
      throw new Error(`Stock quantity cannot be negative: ${newAvailableQuantity}`);
    }

    this._availableQuantity = newAvailableQuantity;
    this._updatedAt = new Date();

    this.apply(new InventoryUpdatedEvent(this._id, this._productId, this._availableQuantity, this._correlationId || 'unknown'));
  }

  deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date();
  }

  activate(): void {
    this._isActive = true;
    this._updatedAt = new Date();
  }

  // Getters
  get id(): string { return this._id; }
  get productId(): string { return this._productId; }
  get name(): string { return this._name; }
  get description(): string { return this._description; }
  get availableQuantity(): number { return this._availableQuantity; }
  get reservedQuantity(): number { return this._reservedQuantity; }
  get inTransitQuantity(): number { return this._inTransitQuantity; }
  get minStockLevel(): number { return this._minStockLevel; }
  get category(): string { return this._category; }
  get isActive(): boolean { return this._isActive; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }
  get version(): number { return this._version; }
  get uncommittedEvents(): BaseDomainEvent[] { return [...this._uncommittedEvents]; }
  get correlationId(): string | undefined { return this._correlationId; }

  // Métodos de utilidad
  get totalQuantity(): number {
    return this._availableQuantity + this._reservedQuantity + this._inTransitQuantity;
  }

  isLowStock(): boolean {
    return this._availableQuantity <= this._minStockLevel;
  }

  hasAvailableStock(quantity: number): boolean {
    return this._isActive && this._availableQuantity >= quantity;
  }

  hasReservedStock(quantity: number): boolean {
    return this._reservedQuantity >= quantity;
  }

  // Métodos de Event Sourcing
  private apply(event: BaseDomainEvent): void {
    this.applyEvent(event);
    this._uncommittedEvents.push(event);
  }

  private applyEvent(event: any): void {
    switch (event.constructor.name) {
      case 'StockReservedEvent':
        this._availableQuantity -= event.quantity;
        this._reservedQuantity += event.quantity;
        this._updatedAt = new Date(event.timestamp);
        break;

      case 'StockReleasedEvent':
        this._reservedQuantity -= event.quantity;
        this._availableQuantity += event.quantity;
        this._updatedAt = new Date(event.timestamp);
        break;

      case 'StockReadyForDeliveryEvent':
        this._reservedQuantity -= event.quantity;
        this._inTransitQuantity += event.quantity;
        this._updatedAt = new Date(event.timestamp);
        break;

      case 'InventoryUpdatedEvent':
        this._availableQuantity = event.availableQuantity;
        this._updatedAt = new Date(event.timestamp);
        break;

      default:
        throw new Error(`Unknown event type: ${event.constructor.name}`);
    }
  }

  markEventsAsCommitted(): void {
    this._uncommittedEvents = [];
  }

  // Método para crear snapshot
  toSnapshot(): InventoryState {
    return {
      id: this._id,
      productId: this._productId,
      name: this._name,
      description: this._description,
      availableQuantity: this._availableQuantity,
      reservedQuantity: this._reservedQuantity,
      inTransitQuantity: this._inTransitQuantity,
      minStockLevel: this._minStockLevel,
      category: this._category,
      isActive: this._isActive,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  // Método para establecer correlationId (usado por el sistema)
  setCorrelationId(correlationId: string): void {
    (this as any)._correlationId = correlationId;
  }
}
