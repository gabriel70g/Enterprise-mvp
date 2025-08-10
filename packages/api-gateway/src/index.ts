import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import swaggerSpec from '../openapi/gateway.json';

const app = express();
const PORT = process.env.PORT || 3005;

// Determine service URLs based on environment
const isDocker = process.env.NODE_ENV === 'production' || process.env.DOCKER_ENV === 'true';
const orderServiceUrl = process.env.ORDER_SERVICE_URL || (isDocker ? 'http://order-service:3001' : 'http://localhost:3001');
const paymentServiceUrl = process.env.PAYMENT_SERVICE_URL || (isDocker ? 'http://payment-service:3002' : 'http://localhost:3002');
const inventoryServiceUrl = process.env.INVENTORY_SERVICE_URL || (isDocker ? 'http://inventory-service:3003' : 'http://localhost:3003');

console.log('Service URLs:', {
  orderService: orderServiceUrl,
  paymentService: paymentServiceUrl,
  inventoryService: inventoryServiceUrl,
  isDocker
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-Correlation-ID-test');
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    serviceUrls: {
      orderService: orderServiceUrl,
      paymentService: paymentServiceUrl,
      inventoryService: inventoryServiceUrl
    }
  });
});

// Serve OpenAPI spec
app.get('/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(swaggerSpec);
});

// Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'CQRS Enterprise MVP - API Gateway'
}));

// API routes with proxy
app.use('/api/orders', createProxyMiddleware({
  target: orderServiceUrl,
  changeOrigin: true,
  pathRewrite: (path) => {
    if (path === '/api/orders' || path === '/api/orders/') return '/orders';
    if (path.startsWith('/api/orders/health')) return '/health';
    return path.replace(/^\/api\/orders/, '/orders');
  },
  onProxyReq: (proxyReq, req, _res) => {
    const contentType = req.headers['content-type'] || '';
    if (req.method !== 'GET' && req.method !== 'HEAD' && typeof (req as any).body !== 'undefined') {
      const hasJson = String(contentType).includes('application/json');
      const bodyData = hasJson ? JSON.stringify((req as any).body) : undefined;
      if (bodyData) {
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    }
  },
  logLevel: 'debug'
}));

app.use('/api/payments', createProxyMiddleware({
  target: paymentServiceUrl,
  changeOrigin: true,
  pathRewrite: (path) => {
    if (path === '/api/payments' || path === '/api/payments/') return '/payments';
    if (path.startsWith('/api/payments/health')) return '/health';
    return path.replace(/^\/api\/payments/, '/payments');
  },
  onProxyReq: (proxyReq, req, _res) => {
    const contentType = req.headers['content-type'] || '';
    if (req.method !== 'GET' && req.method !== 'HEAD' && typeof (req as any).body !== 'undefined') {
      const hasJson = String(contentType).includes('application/json');
      const bodyData = hasJson ? JSON.stringify((req as any).body) : undefined;
      if (bodyData) {
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    }
  },
  logLevel: 'debug'
}));

app.use('/api/inventory', createProxyMiddleware({
  target: inventoryServiceUrl,
  changeOrigin: true,
  pathRewrite: (path) => {
    if (path === '/api/inventory' || path === '/api/inventory/') return '/inventory';
    if (path.startsWith('/api/inventory/health')) return '/health';
    return path.replace(/^\/api\/inventory/, '/inventory');
  },
  onProxyReq: (proxyReq, req, _res) => {
    const contentType = req.headers['content-type'] || '';
    if (req.method !== 'GET' && req.method !== 'HEAD' && typeof (req as any).body !== 'undefined') {
      const hasJson = String(contentType).includes('application/json');
      const bodyData = hasJson ? JSON.stringify((req as any).body) : undefined;
      if (bodyData) {
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    }
  },
  logLevel: 'debug'
}));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🚀 CQRS Enterprise MVP - API Gateway',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      docs: '/docs',
      orders: '/api/orders',
      payments: '/api/payments',
      inventory: '/api/inventory'
    },
    serviceUrls: {
      orderService: orderServiceUrl,
      paymentService: paymentServiceUrl,
      inventoryService: inventoryServiceUrl
    }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Gateway Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
      timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
      timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📚 Swagger UI available at http://localhost:${PORT}/docs`);
  console.log(`🏥 Health check at http://localhost:${PORT}/health`);
  console.log(`🔗 Service URLs:`, {
    orderService: orderServiceUrl,
    paymentService: paymentServiceUrl,
    inventoryService: inventoryServiceUrl
  });
});

export default app;
