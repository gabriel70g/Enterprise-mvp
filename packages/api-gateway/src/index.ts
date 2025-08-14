import express from 'express';
import type { Request } from 'express';
import swaggerUi from 'swagger-ui-express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { createOrderCommandProxy } from './middlewares/command.proxy';
import { traceInterceptor } from './middlewares/tracing';
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

// Interceptor de tracing simple - una línea para implementar
app.use('/api', traceInterceptor);

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

// Ruta específica para crear órdenes de forma asíncrona
app.post('/api/orders', createOrderCommandProxy);

// Función de filtro para el proxy. Excluye las rutas que se manejan de forma especial.
const apiProxyFilter = (pathname: string, req: Request) => {
  return !(pathname.startsWith('/api/orders') && req.method === 'POST');
};

// Opciones para el proxy. Tiparlo explícitamente como `Options` resuelve la ambigüedad del typado.
const apiProxyOptions: Options = {
  changeOrigin: true,
  logLevel: 'info',
  onProxyReq,
  pathRewrite: {
    // These rules are now applied to the full path, making them reliable.
    '^/api/orders': '/orders',
    '^/api/payments': '/payments',
    '^/api/inventory': '/inventory',
    '^/api/products': '/products', // Los productos son consultados en el order-service
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
    if (req.path.startsWith('/api/products')) {
      return orderServiceUrl; // El catálogo de productos es gestionado por el order-service
    }
    return undefined; // Let Express handle it (will 404)
  },
};

// A single, smarter proxy for all API routes. This is more robust and maintainable.
const apiProxy = createProxyMiddleware(apiProxyFilter, apiProxyOptions);

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
    const server = app.listen(PORT, () => {
      console.log(`🚀 API Gateway running on port ${PORT}`);
      console.log(`📚 Swagger UI available at http://localhost:${PORT}/docs`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`[${signal}] received, shutting down gracefully...`);
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  } catch (error) {
    console.error('Failed to start API Gateway:', error);
    process.exit(1);
  }
};

startServer();

export default app;