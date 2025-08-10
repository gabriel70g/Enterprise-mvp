import { Request, Response } from 'express';
import { CommandBus } from '../application/command-bus';
import { ProcessPaymentCommand, CancelPaymentCommand } from '../domain/commands/payment.commands';
import { randomUUID } from 'crypto';

export class PaymentController {
  constructor(private commandBus: CommandBus) {}

  async processPayment(req: Request, res: Response): Promise<void> {
    try {
      const correlationId = req.headers['x-correlation-id'] as string || randomUUID();
      
      const command = new ProcessPaymentCommand(
        correlationId,
        req.body.orderId,
        req.body.amount
      );

      await this.commandBus.execute(command);

      res.status(201).json({
        success: true,
        data: {
          paymentId: command.id,
          correlationId: command.correlationId
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async cancelPayment(req: Request, res: Response): Promise<void> {
    try {
      const correlationId = req.headers['x-correlation-id'] as string || randomUUID();
      
      const command = new CancelPaymentCommand(
        correlationId,
        req.params.orderId,
        req.body.reason
      );

      await this.commandBus.execute(command);

      res.json({
        success: true,
        data: {
          correlationId: command.correlationId
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}
