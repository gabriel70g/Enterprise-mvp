#!/bin/bash

echo "🚀 Starting CQRS Monorepo Enterprise MVP..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install it and try again."
    exit 1
fi

print_status "Building Order Service..."
cd packages/order-service
npm install
npm run build
if [ $? -ne 0 ]; then
    print_error "Failed to build Order Service"
    exit 1
fi
print_success "Order Service built successfully"
cd ../..

print_status "Building Payment Service..."
cd packages/payment-service
npm install
npm run build
if [ $? -ne 0 ]; then
    print_error "Failed to build Payment Service"
    exit 1
fi
print_success "Payment Service built successfully"
cd ../..

print_status "Building Inventory Service..."
cd packages/inventory-service
npm install
npm run build
if [ $? -ne 0 ]; then
    print_error "Failed to build Inventory Service"
    exit 1
fi
print_success "Inventory Service built successfully"
cd ../..

print_status "Building API Gateway..."
cd packages/api-gateway
npm install
npm run build
if [ $? -ne 0 ]; then
    print_error "Failed to build API Gateway"
    exit 1
fi
print_success "API Gateway built successfully"
cd ../..

print_success "All packages built successfully!"

print_status "Starting infrastructure with Docker Compose..."
cd infra

# Stop any existing containers
print_status "Stopping existing containers..."
docker compose down

# Clean up old images to ensure fresh build
print_status "Cleaning up old Docker images..."
docker image prune -f

# Build all services with no cache to ensure latest changes
print_status "Building Docker images (this may take a few minutes)..."
docker compose build --no-cache

if [ $? -ne 0 ]; then
    print_error "Failed to build Docker images"
    exit 1
fi
print_success "Docker images built successfully"

# Start services
print_status "Starting services..."
docker compose up -d

# Wait for services to be healthy
print_status "Waiting for services to be healthy..."
sleep 30

# Check service health
print_status "Checking service health..."

# Check API Gateway
if curl -f http://localhost:3005/health > /dev/null 2>&1; then
    print_success "API Gateway is healthy"
else
    print_warning "API Gateway health check failed"
fi

# Check Order Service
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    print_success "Order Service is healthy"
else
    print_warning "Order Service health check failed"
fi

# Check Payment Service
if curl -f http://localhost:3002/health > /dev/null 2>&1; then
    print_success "Payment Service is healthy"
else
    print_warning "Payment Service health check failed"
fi

# Check Inventory Service
if curl -f http://localhost:3003/health > /dev/null 2>&1; then
    print_success "Inventory Service is healthy"
else
    print_warning "Inventory Service health check failed"
fi

print_success "🎉 CQRS Monorepo Enterprise MVP is running!"
echo ""
echo "📋 Service URLs:"
echo "   API Gateway:     http://localhost:3005"
echo "   API Docs:        http://localhost:3005/docs"
echo "   Order Service:   http://localhost:3001"
echo "   Payment Service: http://localhost:3002"
echo "   Inventory Service: http://localhost:3003"
echo ""
echo "🔍 Kafka Topics:"
echo "   orders-events, orders-commands, payments-events, inventory-events"
echo ""
echo "📊 Monitor with: docker compose logs -f [service-name]"
echo "🛑 Stop with: docker compose down"
echo ""
print_status "Ready to test CQRS + Event Sourcing! 🚀"
