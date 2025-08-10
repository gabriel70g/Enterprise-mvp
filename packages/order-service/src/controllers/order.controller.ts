import { Request, Response } from 'express';
import { CommandBus } from '../application/command-bus';
import { CreateOrderCommand, ConfirmOrderCommand, CancelOrderCommand } from '../domain/commands/order.commands';
import { randomUUID } from 'crypto';

export class OrderController {
  constructor(private commandBus: CommandBus) {}

  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const correlationId = (req.headers['x-correlation-id'] as string) || randomUUID();
      
      const command = new CreateOrderCommand(
        correlationId,
        req.body.customerId,
        req.body.items
      );

      await this.commandBus.execute(command);

      res.status(201).json({
        success: true,
        data: {
          orderId: command.id,
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

  async confirmOrder(req: Request, res: Response): Promise<void> {
    try {
      const correlationId = (req.headers['x-correlation-id'] as string) || randomUUID();
      
      const command = new ConfirmOrderCommand(
        correlationId,
        req.params.orderId
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

  async cancelOrder(req: Request, res: Response): Promise<void> {
    try {
      const correlationId = (req.headers['x-correlation-id'] as string) || randomUUID();
      
      const command = new CancelOrderCommand(
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
