-- Script de inicialización para Enterprise MVP CQRS
-- Base de datos: cqrs_demo

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de productos (catálogo)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    category VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de órdenes (proyección para queries rápidos)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY,
    customer_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL,
    correlation_id VARCHAR(255),
    version INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Tabla de items de orden (proyección para queries rápidos)
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL,
    product_id UUID NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Tabla de pagos (proyección para queries rápidos)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    method VARCHAR(100),
    correlation_id VARCHAR(255),
    version INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Tabla de inventarios (proyección para queries rápidos)
CREATE TABLE IF NOT EXISTS inventories (
    id UUID PRIMARY KEY,
    product_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    available_quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER NOT NULL DEFAULT 0,
    in_transit_quantity INTEGER NOT NULL DEFAULT 0,
    min_stock_level INTEGER NOT NULL DEFAULT 5,
    category VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    correlation_id VARCHAR(255),
    version INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_correlation ON orders(correlation_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_inventories_product ON inventories(product_id);
CREATE INDEX IF NOT EXISTS idx_inventories_category ON inventories(category);
CREATE INDEX IF NOT EXISTS idx_inventories_active ON inventories(is_active);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventories_updated_at BEFORE UPDATE ON inventories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar datos de ejemplo

-- Productos
INSERT INTO products (id, name, description, price, stock, category) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'iPhone 15 Pro', 'Smartphone Apple con chip A17 Pro', 999.99, 50, 'Electronics'),
    ('550e8400-e29b-41d4-a716-446655440002', 'MacBook Air M2', 'Laptop Apple con chip M2', 1199.99, 30, 'Electronics'),
    ('550e8400-e29b-41d4-a716-446655440003', 'AirPods Pro', 'Auriculares inalámbricos con cancelación de ruido', 249.99, 100, 'Electronics'),
    ('550e8400-e29b-41d4-a716-446655440004', 'iPad Air', 'Tablet Apple con chip M1', 599.99, 25, 'Electronics'),
    ('550e8400-e29b-41d4-a716-446655440005', 'Apple Watch Series 9', 'Reloj inteligente con monitor cardíaco', 399.99, 75, 'Electronics'),
    ('550e8400-e29b-41d4-a716-446655440006', 'Nike Air Max 270', 'Zapatillas deportivas con tecnología Air', 150.00, 200, 'Sports'),
    ('550e8400-e29b-41d4-a716-446655440007', 'Adidas Ultraboost 22', 'Zapatillas running con tecnología Boost', 180.00, 150, 'Sports'),
    ('550e8400-e29b-41d4-a716-446655440008', 'Samsung Galaxy S24', 'Smartphone Android con IA avanzada', 799.99, 40, 'Electronics'),
    ('550e8400-e29b-41d4-a716-446655440009', 'Sony WH-1000XM5', 'Auriculares con cancelación de ruido líder', 399.99, 60, 'Electronics'),
    ('550e8400-e29b-41d4-a716-446655440010', 'Dell XPS 13', 'Laptop Windows con pantalla InfinityEdge', 999.99, 35, 'Electronics');

-- Clientes
INSERT INTO customers (id, name, email, phone, address) VALUES
    ('660e8400-e29b-41d4-a716-446655440001', 'Juan Pérez', 'juan.perez@email.com', '+1-555-0101', '123 Main St, New York, NY'),
    ('660e8400-e29b-41d4-a716-446655440002', 'María García', 'maria.garcia@email.com', '+1-555-0102', '456 Oak Ave, Los Angeles, CA'),
    ('660e8400-e29b-41d4-a716-446655440003', 'Carlos López', 'carlos.lopez@email.com', '+1-555-0103', '789 Pine Rd, Chicago, IL'),
    ('660e8400-e29b-41d4-a716-446655440004', 'Ana Martínez', 'ana.martinez@email.com', '+1-555-0104', '321 Elm St, Miami, FL'),
    ('660e8400-e29b-41d4-a716-446655440005', 'Luis Rodríguez', 'luis.rodriguez@email.com', '+1-555-0105', '654 Maple Dr, Seattle, WA');

-- Inventarios iniciales
INSERT INTO inventories (id, product_id, name, description, available_quantity, min_stock_level, category) VALUES
    ('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'iPhone 15 Pro', 'Smartphone Apple con chip A17 Pro', 50, 10, 'Electronics'),
    ('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'MacBook Air M2', 'Laptop Apple con chip M2', 30, 5, 'Electronics'),
    ('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'AirPods Pro', 'Auriculares inalámbricos con cancelación de ruido', 100, 20, 'Electronics'),
    ('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'iPad Air', 'Tablet Apple con chip M1', 25, 5, 'Electronics'),
    ('770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', 'Apple Watch Series 9', 'Reloj inteligente con monitor cardíaco', 75, 15, 'Electronics');

-- Mensaje de confirmación
SELECT 'Base de datos inicializada exitosamente!' as status;
SELECT COUNT(*) as total_products FROM products;
SELECT COUNT(*) as total_customers FROM customers;
SELECT COUNT(*) as total_inventories FROM inventories;
