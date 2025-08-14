-- Crear tablas para el catálogo de productos
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    min_stock_level INTEGER NOT NULL DEFAULT 5,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de clientes
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de órdenes (para queries rápidas)
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'created',
    total_amount DECIMAL(10,2) NOT NULL,
    correlation_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Crear tabla de items de orden
CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    product_id VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Crear índices para performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_correlation ON orders(correlation_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);

-- Insertar productos de ejemplo
INSERT INTO products (id, name, description, price, stock_quantity, category) VALUES
('prod_001', 'iPhone 15 Pro', 'Smartphone Apple con chip A17 Pro', 999.99, 50, 'Electronics'),
('prod_002', 'MacBook Air M2', 'Laptop ultraligera con chip M2', 1199.99, 30, 'Electronics'),
('prod_003', 'AirPods Pro', 'Auriculares inalámbricos con cancelación de ruido', 249.99, 100, 'Electronics'),
('prod_004', 'iPad Air', 'Tablet versátil con chip M1', 599.99, 75, 'Electronics'),
('prod_005', 'Apple Watch Series 9', 'Reloj inteligente con monitoreo de salud', 399.99, 60, 'Electronics'),
('prod_006', 'Nike Air Max 270', 'Zapatillas deportivas cómodas', 129.99, 200, 'Sports'),
('prod_007', 'Adidas Ultraboost', 'Zapatillas de running premium', 179.99, 150, 'Sports'),
('prod_008', 'Samsung Galaxy S24', 'Smartphone Android con IA', 799.99, 40, 'Electronics'),
('prod_009', 'Sony WH-1000XM5', 'Auriculares premium con cancelación de ruido', 349.99, 80, 'Electronics'),
('prod_010', 'Dell XPS 13', 'Laptop Windows ultrabook', 999.99, 25, 'Electronics');

-- Insertar clientes de ejemplo
INSERT INTO customers (id, name, email, phone, address) VALUES
('customer_001', 'Juan Pérez', 'juan.perez@email.com', '+1-555-0101', '123 Main St, City, State'),
('customer_002', 'María García', 'maria.garcia@email.com', '+1-555-0102', '456 Oak Ave, City, State'),
('customer_003', 'Carlos López', 'carlos.lopez@email.com', '+1-555-0103', '789 Pine Rd, City, State'),
('customer_004', 'Ana Rodríguez', 'ana.rodriguez@email.com', '+1-555-0104', '321 Elm St, City, State'),
('customer_005', 'Luis Martínez', 'luis.martinez@email.com', '+1-555-0105', '654 Maple Dr, City, State');

-- Crear función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear triggers para actualizar timestamps
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
