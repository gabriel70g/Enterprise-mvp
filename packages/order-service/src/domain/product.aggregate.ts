import { BaseDomainEvent } from './events/base.event';

export interface ProductInfo {
  id: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  category: string;
  isActive: boolean;
}

export class Product {
  private _id: string;
  private _name: string;
  private _description: string;
  private _price: number;
  private _stockQuantity: number;
  private _category: string;
  private _isActive: boolean;

  constructor(info: ProductInfo) {
    this._id = info.id;
    this._name = info.name;
    this._description = info.description;
    this._price = info.price;
    this._stockQuantity = info.stockQuantity;
    this._category = info.category;
    this._isActive = info.isActive;
  }

  // Getters
  get id(): string { return this._id; }
  get name(): string { return this._name; }
  get description(): string { return this._description; }
  get price(): number { return this._price; }
  get stockQuantity(): number { return this._stockQuantity; }
  get category(): string { return this._category; }
  get isActive(): boolean { return this._isActive; }

  // Métodos de negocio
  hasStock(quantity: number): boolean {
    return this._isActive && this._stockQuantity >= quantity;
  }

  reserveStock(quantity: number): void {
    if (!this.hasStock(quantity)) {
      throw new Error(`Insufficient stock for product ${this._id}. Available: ${this._stockQuantity}, Requested: ${quantity}`);
    }
    this._stockQuantity -= quantity;
  }

  releaseStock(quantity: number): void {
    this._stockQuantity += quantity;
  }

  isLowStock(): boolean {
    return this._stockQuantity <= this.stockQuantity;
  }

  updatePrice(newPrice: number): void {
    if (newPrice <= 0) {
      throw new Error('Price must be greater than zero');
    }
    this._price = newPrice;
  }

  updateStock(newQuantity: number): void {
    if (newQuantity < 0) {
      throw new Error('Stock quantity cannot be negative');
    }
    this._stockQuantity = newQuantity;
  }

  deactivate(): void {
    this._isActive = false;
  }

  activate(): void {
    this._isActive = true;
  }

  // Método para crear snapshot
  toSnapshot(): ProductInfo {
    return {
      id: this._id,
      name: this._name,
      description: this._description,
      price: this._price,
      stockQuantity: this._stockQuantity,
      category: this._category,
      isActive: this._isActive,
    };
  }
}
