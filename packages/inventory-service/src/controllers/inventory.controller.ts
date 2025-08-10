import { Request, Response } from 'express';
import { CommandBus } from '../application/command-bus';
import { ReserveProductCommand, ReleaseProductCommand, UpdateInventoryCommand } from '../domain/commands/inventory.commands';
import { randomUUID } from 'crypto';

export class InventoryController {
  constructor(private commandBus: CommandBus) {}

  async reserveProduct(req: Request, res: Response): Promise<void> {
    try {
      const correlationId = req.headers['x-correlation-id'] as string || randomUUID();
      
      const command = new ReserveProductCommand(
        correlationId,
        req.body.orderId,
        req.body.productId,
        req.body.quantity
      );

      await this.commandBus.execute(command);

      res.status(201).json({
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

  async releaseProduct(req: Request, res: Response): Promise<void> {
    try {
      const correlationId = req.headers['x-correlation-id'] as string || randomUUID();
      
      const command = new ReleaseProductCommand(
        correlationId,
        req.body.orderId,
        req.body.productId,
        req.body.quantity
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

  async updateInventory(req: Request, res: Response): Promise<void> {
    try {
      const correlationId = req.headers['x-correlation-id'] as string || randomUUID();
      
      const command = new UpdateInventoryCommand(
        correlationId,
        req.body.productId,
        req.body.quantity
      );

      await this.commandBus.execute(command);

      res.status(201).json({
        success: true,
        data: {
          inventoryId: command.id,
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
