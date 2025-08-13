import express from 'express';
import type { Request } from 'express';
import swaggerUi from 'swagger-ui-express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { tracer } from './lib/tracer';
import { tracingMiddleware } from './middlewares/tracing';
import swaggerSpec from '../openapi/gateway.json';
import type { ClientRequest } from 'http';

const app = express();
const PORT = process.env.PORT || 3005;

// Service URLs are taken directly from environment variables set in docker-compose
const orderServiceUrl = process.env.ORDER_SERVICE_URL || 'http://localhost:3001';
const paymentServiceUrl = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3002';
const inventoryServiceUrl = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3003';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'api-gateway' });
});

// Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'CQRS Enterprise MVP - API Gateway'
}));

// Este es el cambio clave: aplicamos nuestro middleware de trazabilidad a todas las rutas de la API.
// Automáticamente registrará el inicio (pending) y el final (completed/failed) de cada solicitud.
app.use('/api', tracingMiddleware);

// Cuando se usa `express.json()`, el cuerpo de la solicitud se consume.
// `http-proxy-middleware` necesita que el cuerpo se re-transmita al servicio de destino.
// Esta función `onProxyReq` se encarga de ello.
const onProxyReq = (proxyReq: ClientRequest, req: Request) => {
  if (req.body) {
    const bodyData = JSON.stringify(req.body);
    // Es importante re-escribir los headers de contenido y escribir el cuerpo.
    proxyReq.setHeader('Content-Type', 'application/json');
    proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
    proxyReq.write(bodyData);
  }
};

// A single, smarter proxy for all API routes. This is more robust and maintainable.
const apiProxy = createProxyMiddleware({
  changeOrigin: true,
  logLevel: 'info',
  onProxyReq,
  pathRewrite: {
    // These rules are now applied to the full path, making them reliable.
    '^/api/orders': '/orders',
    '^/api/payments': '/payments',
    '^/api/inventory': '/inventory',
  },
  router: (req) => {
    // The router decides which service to send the request to.
    if (req.path.startsWith('/api/orders')) {
      return orderServiceUrl;
    }
    if (req.path.startsWith('/api/payments')) {
      return paymentServiceUrl;
    }
    if (req.path.startsWith('/api/inventory')) {
      return inventoryServiceUrl;
    }
    return undefined; // Let Express handle it (will 404)
  },
});

app.use('/api', apiProxy);

// A simple root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🚀 CQRS Enterprise MVP - API Gateway',
    docs: '/docs',
    health: '/health',
  });
});

// Generic 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Start server logic
const startServer = async () => {
  try {
    // Connect the tracer's Kafka producer before starting the server
    await tracer.connect();

    const server = app.listen(PORT, () => {
      console.log(`🚀 API Gateway running on port ${PORT}`);
      console.log(`📚 Swagger UI available at http://localhost:${PORT}/docs`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`[${signal}] received, shutting down gracefully...`);
      server.close(async () => {
        console.log('HTTP server closed.');
        // The Kafka producer will be disconnected automatically when the process exits.
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start API Gateway:', error);
    process.exit(1);
  }
};

startServer();

export default app;