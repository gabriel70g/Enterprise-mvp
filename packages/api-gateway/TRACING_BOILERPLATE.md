# 🚀 Tracing Boilerplate - Fácil de replicar en cualquier servicio

## 📁 **Archivos necesarios (solo 2):**

### 1. **`lib/tracer.ts`** - Cliente Kafka simple
```typescript
import { Kafka } from 'kafkajs';

const kafka = new Kafka({ 
  clientId: 'mi-servicio-tracer',
  brokers: process.env.KAFKA_BROKERS?.split(',') || ['kafka:9092'] 
});

const producer = kafka.producer();

// Conectar al iniciar
producer.connect().catch(console.error);

// Función simple de una línea para publicar trazas
export const publishTrace = async (data: any) => {
  try {
    await producer.send({ 
      topic: 'trace-events', 
      messages: [{ 
        value: JSON.stringify({ 
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          service: 'mi-servicio', // ← Cambiar por el nombre de tu servicio
          ...data 
        }) 
      }] 
    });
  } catch (error) {
    console.error('Error publishing trace:', error);
  }
};
```

### 2. **`middlewares/tracing.ts`** - Interceptor Express
```typescript
import { Request, Response, NextFunction } from 'express';
import { publishTrace } from '../lib/tracer';

// Interceptor simple y reutilizable - casi un boilerplate
export const traceInterceptor = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const correlationId = req.headers['x-correlation-id'] || `gen-${Date.now()}`;
  const action = req.path.split('/')[1] || 'unknown'; // /orders -> orders
  
  // Request - una línea
  publishTrace({ correlationId, action: 'Request', status: 'pending', duration: 0, service: action });
  
  // Response - una línea
  res.on('finish', () => publishTrace({ 
    correlationId, 
    action: 'Response', 
    status: res.statusCode >= 400 ? 'failed' : 'completed',
    duration: Date.now() - startTime,
    service: action,
    statusCode: res.statusCode
  }));
  
  next();
};
```

## 🚀 **Implementación (solo 2 líneas):**

```typescript
import { traceInterceptor } from './middlewares/tracing';

// En tu app Express
app.use('/api', traceInterceptor); // ← ¡Listo! Solo 2 líneas
```

## 📦 **Dependencias necesarias:**

```json
{
  "dependencies": {
    "kafkajs": "^2.2.4"
  }
}
```

## 🎯 **¿Qué hace automáticamente?**

✅ **Request**: Envía evento `pending` al inicio
✅ **Response**: Envía evento `completed/failed` al final
✅ **Correlation ID**: Extrae del header o genera automáticamente
✅ **Duración**: Calcula tiempo total de la operación
✅ **Status**: Detecta automáticamente si falló o completó
✅ **Kafka**: Publica en topic `trace-events`

## 🔄 **Flujo completo:**

```
Request → pending → Kafka → BFF → Dashboard
Response → completed/failed → Kafka → BFF → Dashboard
```

## 💡 **Personalización:**

- **Cambiar `service`** en `tracer.ts`
- **Modificar `action`** en el interceptor
- **Agregar campos** al payload según necesites
- **Cambiar topic** de Kafka si quieres

## ⚡ **¡Eso es todo!**

**Solo 2 archivos + 2 líneas de código** para implementar tracing completo en cualquier servicio Express.
