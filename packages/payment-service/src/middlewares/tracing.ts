import { Request, Response, NextFunction } from 'express';
import { publishTrace } from '../lib/tracer';

// Interceptor simple y reutilizable - casi un boilerplate
export const traceInterceptor = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const correlationId = req.headers['x-correlation-id'] || `gen-${Date.now()}`;
  const serviceName = process.env.SERVICE_NAME || 'payment-service';
  
  // Request - una línea
  publishTrace({ correlationId, action: 'Request', status: 'pending', duration: 0, service: serviceName });
  
  // Response - una línea
  res.on('finish', () => publishTrace({ 
    correlationId, 
    action: 'Response', 
    status: res.statusCode >= 400 ? 'failed' : 'completed',
    duration: Date.now() - startTime,
    service: serviceName,
    statusCode: res.statusCode
  }));
  
  next();
};
