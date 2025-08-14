import { Pool } from 'pg';
import { Product, ProductInfo } from '../domain/product.aggregate';

export interface ProductRepository {
  findById(id: string): Promise<Product | null>;
  findByIds(ids: string[]): Promise<Product[]>;
  findByCategory(category: string): Promise<Product[]>;
  findActive(): Promise<Product[]>;
}

export class PostgresProductRepository implements ProductRepository {
  private pool: Pool;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL || 'postgresql://cqrs_user:cqrs_password@localhost:5432/cqrs_demo';
    
    this.pool = new Pool({
      connectionString: databaseUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  async findById(id: string): Promise<Product | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM products WHERE id = $1 AND is_active = true',
        [id]
      );
      
      if (result.rows.length === 0) return null;
      
      const productData = result.rows[0];
      return this.mapToProduct(productData);
    } finally {
      client.release();
    }
  }

  async findByIds(ids: string[]): Promise<Product[]> {
    if (ids.length === 0) return [];
    
    const client = await this.pool.connect();
    try {
      const placeholders = ids.map((_, index) => `$${index + 1}`).join(',');
      const result = await client.query(
        `SELECT * FROM products WHERE id IN (${placeholders}) AND is_active = true`,
        ids
      );
      
      return result.rows.map(row => this.mapToProduct(row));
    } finally {
      client.release();
    }
  }

  async findByCategory(category: string): Promise<Product[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM products WHERE category = $1 AND is_active = true ORDER BY name',
        [category]
      );
      
      return result.rows.map(row => this.mapToProduct(row));
    } finally {
      client.release();
    }
  }

  async findActive(): Promise<Product[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM products WHERE is_active = true ORDER BY category, name'
      );
      
      return result.rows.map(row => this.mapToProduct(row));
    } finally {
      client.release();
    }
  }

  private mapToProduct(row: any): Product {
    const productInfo: ProductInfo = {
      id: row.id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      stockQuantity: row.stock,
      category: row.category,
      isActive: row.is_active,
    };
    
    return new Product(productInfo);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
