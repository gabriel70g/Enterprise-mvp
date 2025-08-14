import { Request, Response, NextFunction } from 'express';
import { publishTrace } from '../lib/tracer';

// Interceptor simple y reutilizable - casi un boilerplate
export const traceInterceptor = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const correlationId = req.headers['x-correlation-id'] || `gen-${Date.now()}`;
  const serviceName = 'order-service'; // Nombre fijo del servicio
  
  // Extraer orderId de la URL si existe
  const orderId = req.params.orderId || req.body.orderId || null;
  
  // Request - una línea
  publishTrace({ 
    correlationId, 
    action: 'Request', 
    status: 'pending', 
    duration: 0, 
    service: serviceName,
    orderId,
    details: { method: req.method, path: req.path }
  });
  
  // Response - una línea
  res.on('finish', () => publishTrace({ 
    correlationId, 
    action: 'Response', 
    status: res.statusCode >= 400 ? 'failed' : 'completed',
    duration: Date.now() - startTime,
    service: serviceName,
    statusCode: res.statusCode,
    orderId,
    details: { method: req.method, path: req.path }
  }));
  
  next();
};
