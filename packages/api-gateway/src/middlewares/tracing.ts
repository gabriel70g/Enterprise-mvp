import { tracer } from '../lib/tracer';
import { Request, Response, NextFunction } from 'express';
import onFinished from 'on-finished';

/**
 * Express middleware to trace the full lifecycle of a request.
 * It sends a 'pending' event on request start and a 'completed'/'failed'
 * event when the response is finished.
 */
export const tracingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const correlationId = (req.headers['x-correlation-id'] as string) || `generated-${Date.now()}`;
  // Extract target service from path, e.g., /api/orders -> orders
  const serviceName = req.path.split('/')[1] || 'unknown';

  // 1. Send the 'pending' event immediately
  tracer.send({
    correlationId,
    action: 'ProxyRequest',
    status: 'pending',
    duration: 0,
    payload: {
      targetService: `${serviceName}-service`,
      method: req.method,
      url: req.originalUrl,
    },
  });

  // 2. Hook into the response finishing event
  onFinished(res, (err, finishedRes) => {
    const duration = Date.now() - startTime;
    const status = err || finishedRes.statusCode >= 400 ? 'failed' : 'completed';

    // 3. Send the final 'completed' or 'failed' event
    tracer.send({
      correlationId,
      action: 'ProxyResponse',
      status,
      duration,
      payload: {
        targetService: `${serviceName}-service`,
        method: req.method,
        url: req.originalUrl,
        statusCode: finishedRes.statusCode,
        error: err ? err.message : undefined,
      },
    });
  });

  next();
};
