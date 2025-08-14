# 🚀 CQRS Enterprise MVP - Monorepo Limpio

Un **MVP Enterprise** que demuestra **CQRS + Event Sourcing + Microservicios** en acción real, con una estructura de monorepo coherente y sin redundancias.

## 🎯 **¿Qué es esto?**

**Es pedagogía real:**
- **Teoría sin práctica** = "CQRS es separar commands de queries" (¿y?)
- **Práctica real** = "Mirá, creás una orden, se dispara un evento, otro servicio lo consume y actualiza inventario"

## ⚠️ **Importante: MVP Esquemático**

**Este proyecto es un MVP conceptual:**
- **Persistencia mínima** solo para demostrar Event Sourcing
- **Órdenes se persisten** para poder confirmarlas/cancelarlas
- **Eventos se almacenan** para demostrar el patrón
- **Sin lógica de negocio real** (inventario, pagos, etc.)
- **Puramente educativo** para entender los patrones

## 🏗️ **Arquitectura y Flujo del Sistema**

### **📊 Diagrama de Arquitectura**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │───▶│  Order Service  │───▶│     Kafka      │
│   (Port 3005)   │    │   (Port 3001)   │    │   (Port 9092)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Payment Service │    │Inventory Service│    │    PostgreSQL   │
│   (Port 3002)   │    │   (Port 3003)   │    │   (Port 5432)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │                       ▼                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   Trace BFF     │    │ Trace Dashboard │
│   (Port 8080)   │    │   (Port 3000)   │
└─────────────────┘    └─────────────────┘
```

### **🔄 Flujo de Eventos del MVP**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Crear Orden   │───▶│ Verificar Stock │───▶│ Reservar Stock  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Procesar Pago   │    │ Confirmar Orden │    │ Notificar       │
│                 │    │                 │    │ Delivery        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Explicación del flujo:**
1. **Crear Orden**: Usuario crea orden (estado: pendiente)
2. **Verificar Stock**: Inventory Service verifica disponibilidad (MVP: siempre hay stock)
3. **Reservar Stock**: Stock se mueve a "en transito" con número de orden
4. **Procesar Pago**: Payment Service procesa pago (MVP: siempre se aprueba)
5. **Confirmar Orden**: Order Service confirma la orden
6. **Notificar Delivery**: Inventory Service notifica que está listo para entrega

**Nota**: En este MVP, el stock y pagos siempre se aprueban. Es un ejemplo conceptual.

## 🏗️ **Estructura del Monorepo**

## 📁 **Estructura del Proyecto**

```
cqrs-enterprise-mvp/
├── package.json                 # ✅ Configuración raíz con workspaces
├── tsconfig.json               # ✅ Configuración TypeScript raíz
├── start-monorepo.sh           # ✅ Script de despliegue
├── infra/
│   └── docker-compose.yml      # ✅ Orquestación de servicios
└── packages/                   # ✅ Todos los servicios aquí
    ├── api-gateway/            # ✅ Gateway principal
    ├── order-service/          # ✅ Servicio de órdenes
    ├── payment-service/        # ✅ Servicio de pagos
    ├── inventory-service/      # ✅ Servicio de inventario
    ├── trace-bff/              # ✅ Backend para tracing
    └── trace-dashboard/        # ✅ Dashboard de trazas en tiempo real
```

## 🚀 **Quick Start - Paso a Paso**

### **1. Prerequisitos**
- Docker & Docker Compose
- Node.js 18+ (usar `nvm use 18`)
- npm

### **2. Instalar dependencias**
```bash
# Instalar dependencias raíz y de todos los workspaces
npm install
npm run install:workspaces
```

### **3. Levantar todo el sistema**
```bash
# Opción 1: Script automático (recomendado)
chmod +x start-monorepo.sh
./start-monorepo.sh

# Opción 2: NPM
npm run start:monorepo

# Opción 3: Docker Compose directo
cd infra && docker compose up --build -d
```

### **4. Verificar que todo funciona**
```bash
# Servicios principales
curl http://localhost:3005/health                    # API Gateway
curl http://localhost:3005/api/orders/health        # Order Service
curl http://localhost:3005/api/payments/health      # Payment Service
curl http://localhost:3005/api/inventory/health     # Inventory Service

# Sistema de tracing
curl http://localhost:8080/health                   # Trace BFF
open http://localhost:3000                          # Trace Dashboard

# Documentación
open http://localhost:3005/docs                     # Swagger UI
```

## 🧪 **Testing - Probar el Circuito Completo**

### **🚀 Quick Test - Todo en 2 Minutos**

**Este test demuestra el flujo completo del MVP:**
1. **Crear Orden** → Se dispara `OrderCreatedEvent`
2. **Verificar Stock** → Inventory Service reserva automáticamente
3. **Procesar Pago** → Payment Service procesa automáticamente
4. **Confirmar Orden** → Se dispara `OrderConfirmedEvent`
5. **Notificar Delivery** → Inventory Service notifica automáticamente

#### **Paso 1: Crear una Orden**
```bash
curl -X POST http://localhost:3005/api/orders \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: flow-test-001" \
  -d '{
    "customerId": "customer-123",
    "items": [
      {
        "productId": "laptop-001",
        "quantity": 1,
        "unitPrice": 999.99
      },
      {
        "productId": "mouse-001", 
        "quantity": 2,
        "unitPrice": 29.99
      }
    ],
    "totalAmount": 1059.97
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "orderId": "uuid-generado",
    "correlationId": "flow-test-001"
  }
}
```

#### **Paso 2: Confirmar la Orden (dispara eventos)**
```bash
# Reemplazar ORDER_ID_HERE con el ID real de la respuesta anterior
curl -X PUT http://localhost:3005/api/orders/ORDER_ID_HERE/confirm \
  -H "X-Correlation-ID: flow-test-001"
```

**Lo que pasa internamente:**
- ✅ Se crea el evento `OrderConfirmedEvent`
- ✅ Se publica en Kafka topic `orders-events`
- ✅ El `InventoryService` notifica que está listo para delivery
- ✅ El sistema está listo para el siguiente paso (entrega)

#### **Paso 3: Verificar el Pago Procesado**
```bash
# Ver logs del payment service
docker logs cqrs_payment_service | grep "flow-test-001"

# O hacer una consulta directa al servicio
curl -X GET http://localhost:3002/payments/ORDER_ID_HERE \
  -H "X-Correlation-ID: flow-test-001"
```

#### **Paso 4: Verificar Inventario Actualizado**
```bash
# Ver logs del inventory service
docker logs cqrs_inventory_service | grep "flow-test-001"

# Consultar estado del inventario
curl -X GET http://localhost:3003/inventory/laptop-001 \
  -H "X-Correlation-ID: flow-test-001"
```

### **🔄 Flujo de Cancelación: Orden → Cancelar Pago → Liberar Inventario**

#### **Paso 1: Cancelar la Orden**
```bash
curl -X PUT http://localhost:3005/api/orders/ORDER_ID_HERE/cancel \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: cancel-test-002" \
  -d '{"reason": "Customer changed mind"}'
```

**Lo que pasa internamente:**
- ✅ Se crea el evento `OrderCancelledEvent`
- ✅ Se publica en Kafka topic `orders-events`
- ✅ El `PaymentService` cancela el pago
- ✅ El `InventoryService` libera el stock reservado (MVP: solo logs)

#### **Paso 2: Verificar Cancelación del Pago**
```bash
docker logs cqrs_payment_service | grep "cancel-test-002"
```

#### **Paso 3: Verificar Inventario Liberado**
```bash
docker logs cqrs_inventory_service | grep "cancel-test-002"
```

### **🧪 Casos de Prueba Rápidos**

#### **Test 1: Orden Simple (1 producto)**
```bash
curl -X POST http://localhost:3005/api/orders \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: simple-test" \
  -d '{
    "customerId": "test-customer",
    "items": [{"productId": "book-001", "quantity": 1, "unitPrice": 19.99}],
    "totalAmount": 19.99
  }'
```

#### **Test 2: Orden Múltiple (varios productos)**
```bash
curl -X POST http://localhost:3005/api/orders \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: multiple-test" \
  -d '{
    "customerId": "test-customer-multiple",
    "items": [
      {"productId": "shirt-001", "quantity": 2, "unitPrice": 25.00},
      {"productId": "pants-001", "quantity": 1, "unitPrice": 45.00}
    ]
  }'
```
#### **Test 3: Orden con Producto Agotado (simular error)**
```bash
# Primero crear una orden normal
# Luego intentar crear otra orden con el mismo producto
# Ver cómo se maneja el error de inventario
```

### **🔍 Monitoreo en Tiempo Real**

#### **Ver todos los eventos en Kafka**
```bash
# Conectarse al contenedor de Kafka
docker exec -it cqrs_monorepo_kafka sh

# Ver mensajes en el topic de órdenes
kafka-console-consumer --bootstrap-server localhost:9092 --topic orders-events --from-beginning

# Ver mensajes en el topic de pagos
kafka-console-consumer --bootstrap-server localhost:9092 --topic payments-events --from-beginning

# Ver mensajes en el topic de inventario
kafka-console-consumer --bootstrap-server localhost:9092 --topic inventory-events --from-beginning
```

#### **Ver logs de todos los servicios simultáneamente**
```bash
# Terminal 1: API Gateway
docker logs -f cqrs_api_gateway

# Terminal 2: Order Service
docker logs -f cqrs_order_service

# Terminal 3: Payment Service
docker logs -f cqrs_payment_service

# Terminal 4: Inventory Service
docker logs -f cqrs_inventory_service

# Terminal 5: Trace BFF
docker logs -f cqrs_trace_bff

# Terminal 6: Trace Dashboard
docker logs -f cqrs_trace_dashboard
```

### **📊 Verificar Estado Final**

#### **Checklist de Verificación**
```bash
# 1. Orden creada
curl http://localhost:3005/api/orders/ORDER_ID_HERE

# 2. Pago procesado
curl http://localhost:3005/api/payments/ORDER_ID_HERE

# 3. Inventario actualizado
curl http://localhost:3005/api/inventory/PRODUCT_ID_HERE

# 4. Eventos en Kafka
docker exec cqrs_monorepo_kafka kafka-topics --bootstrap-server localhost:9092 --describe --topic orders-events
```

## 🔧 **Comandos del Monorepo**

```bash
# Build de todos los servicios
npm run build

# Build individual
npm run build:gateway
npm run build:order
npm run build:payment
npm run build:inventory

# Desarrollo individual
npm run dev:gateway
npm run dev:order
npm run dev:payment
npm run dev:inventory

# Limpieza
npm run clean              # Limpiar builds
npm run clean:all          # Limpiar todo (incluye node_modules)

# Despliegue
npm run start:monorepo     # Levantar todo con Docker Compose
```

## 🔍 **Monitoreo y Debugging**

### **Sistema de Tracing en Tiempo Real**
- **Dashboard de Trazas**: http://localhost:3000
- **Trace BFF**: http://localhost:8080
- **Filtrado automático** de health checks (`gen-*`)

### **Formato de Trazas**
```json
{
  "id": "uuid-unico",
  "timestamp": "2025-08-13T19:12:23.984Z",
  "service": "order-service",
  "correlationId": "test-123",
  "action": "Request|Response",
  "status": "pending|completed|failed",
  "duration": 20,
  "orderId": "uuid-real",
  "details": { "method": "POST", "path": "/api/orders" }
}
```

### **Ver logs en tiempo real**
```bash
# API Gateway
docker logs -f cqrs_api_gateway

# Order Service
docker logs -f cqrs_order_service

# Kafka
docker logs -f cqrs_monorepo_kafka
```

### **Verificar estado de contenedores**
```bash
docker ps
docker compose ps
```



## 🏗️ **Patrones Implementados**

### **CQRS (Command Query Responsibility Segregation)**
- **Commands:** Mutaciones que cambian el estado del sistema
- **Queries:** Consultas que solo leen datos
- **Separación completa** de responsabilidades

### **Flujo de Eventos en el MVP**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Crear Orden   │───▶│ Verificar Stock │───▶│ Reservar Stock  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Procesar Pago   │    │ Confirmar Orden │    │ Notificar       │
│                 │    │                 │    │ Delivery        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Cada paso dispara eventos automáticamente via Kafka, creando un flujo reactivo y desacoplado.**

### **Event Sourcing**
- **Event Store:** Registra todos los cambios como eventos
- **Aggregates:** Agrupan entidades relacionadas
- **Event Handlers:** Procesan eventos y actualizan proyecciones

### **Microservicios**
- **API Gateway:** Punto de entrada único
- **Servicios independientes:** Cada uno con su propia base de datos
- **Comunicación asíncrona:** Via Kafka topics

## 🚨 **Solución de Problemas**

### **Swagger UI no funciona**
```bash
# Verificar que el contenedor tiene los archivos OpenAPI
docker exec cqrs_api_gateway ls -la /app/openapi/

# Reconstruir sin cache si es necesario
docker compose build --no-cache api-gateway
```

### **Puertos ocupados**
```bash
# Limpiar Docker
docker system prune -f
docker container prune -f
docker network prune -f

# Verificar puertos en uso
lsof -i :3000-3005
```

### **Kafka no inicia**
```bash
# Ver logs del setup
docker logs cqrs_kafka_setup

# El contenedor cqrs_kafka_setup se baja después de crear topics (normal)
```

## 🚨 **Troubleshooting de Ejemplos**

### **Problema: "Connection refused" en los curl**
```bash
# Verificar que todos los servicios estén corriendo
docker ps

# Verificar health checks
curl http://localhost:3005/health
curl http://localhost:3005/api/orders/health
curl http://localhost:3005/api/payments/health
curl http://localhost:3005/api/inventory/health

# Si algún servicio no responde, revisar logs
docker logs cqrs_api_gateway
docker logs cqrs_order_service
```

### **Problema: Los eventos no se procesan**
```bash
# Verificar que Kafka esté funcionando
docker exec cqrs_monorepo_kafka kafka-topics --bootstrap-server localhost:9092 --list

# Verificar que los topics existan
docker exec cqrs_monorepo_kafka kafka-topics --bootstrap-server localhost:9092 --describe --topic orders-events

# Ver logs de Kafka
docker logs cqrs_monorepo_kafka
```

### **Problema: Correlation ID no se propaga**
```bash
# Verificar que el header se esté enviando correctamente
curl -v -X POST http://localhost:3005/api/orders \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: debug-test" \
  -d '{"customerId": "test", "items": [], "totalAmount": 0}'

# Ver logs de todos los servicios buscando el correlation ID
docker logs cqrs_api_gateway | grep "debug-test"
docker logs cqrs_order_service | grep "debug-test"
docker logs cqrs_payment_service | grep "debug-test"
docker logs cqrs_inventory_service | grep "debug-test"
```

### **Problema: Base de datos no responde**
```bash
# Verificar estado de PostgreSQL
docker exec cqrs_monorepo_postgres pg_isready -U cqrs_user -d cqrs_demo

# Ver logs de PostgreSQL
docker logs cqrs_monorepo_postgres

# Conectarse a la base de datos
docker exec -it cqrs_monorepo_postgres psql -U cqrs_user -d cqrs_demo
```

### **Problema: Los servicios no se comunican entre sí**
```bash
# Verificar que la red Docker esté funcionando
docker network ls
docker network inspect cqrs_1-conceptual_default

# Verificar que los servicios puedan resolver nombres
docker exec cqrs_order_service ping payment-service
docker exec cqrs_order_service ping inventory-service

# Verificar variables de entorno
docker exec cqrs_order_service env | grep SERVICE_URL
```

### **Debugging Avanzado**

#### **Ver todos los eventos en tiempo real**
```bash
# Terminal 1: Monitorear eventos de órdenes
docker exec -it cqrs_monorepo_kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic orders-events \
  --from-beginning

# Terminal 2: Monitorear eventos de pagos
docker exec -it cqrs_monorepo_kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic payments-events \
  --from-beginning

# Terminal 3: Monitorear eventos de inventario
docker exec -it cqrs_monorepo_kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic inventory-events \
  --from-beginning
```

#### **Simular fallos para testing**
```bash
# Detener un servicio para ver cómo se comporta el sistema
docker stop cqrs_payment_service

# Intentar crear una orden (debería fallar en el pago)
curl -X POST http://localhost:3005/api/orders \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: failure-test" \
  -d '{"customerId": "test", "items": [], "totalAmount": 100}'

# Ver logs del order service para ver el error
docker logs cqrs_order_service | grep "failure-test"

# Levantar el servicio nuevamente
docker start cqrs_payment_service
```

## 📚 **Recursos Adicionales**

- **CQRS Pattern:** [Microsoft Docs](https://docs.microsoft.com/en-us/azure/architecture/patterns/cqrs)
- **Event Sourcing:** [Martin Fowler](https://martinfowler.com/eaaDev/EventSourcing.html)
- **Microservices:** [Netflix Tech Blog](https://netflixtechblog.com/)

## 🤝 **Contribuir**

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 **Licencia**

Este proyecto está bajo la Licencia Apache 2.0 - ver el archivo [LICENSE](LICENSE) para detalles.

---

**¿Te gustó el proyecto? ¡Dale una ⭐!**

*"En el desarrollo de software, la simplicidad es la máxima sofisticación"* - Leonardo da Vinci (probablemente)