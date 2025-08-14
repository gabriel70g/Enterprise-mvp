import { Request, Response } from 'express';
import { CommandBus } from '../application/command-bus';
import { EventSourcedInventoryRepository } from '../infrastructure/inventory.repository';
import {
  CreateInventoryCommand,
  ReserveStockCommand,
  ReleaseStockCommand,
  MoveToInTransitCommand,
  UpdateStockCommand,
  DeactivateInventoryCommand,
  ActivateInventoryCommand
} from '../domain/commands/inventory.commands';

export class InventoryController {
  constructor(
    private commandBus: CommandBus,
    private inventoryRepository: EventSourcedInventoryRepository
  ) {}

  async createInventory(req: Request, res: Response): Promise<void> {
    try {
      const { id, productId, name, description, availableQuantity, minStockLevel, category } = req.body;
      
      if (!id || !productId || !name || !availableQuantity || !minStockLevel || !category) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const correlationId = req.headers['x-correlation-id'] as string || 'unknown';
      
      await this.commandBus.execute('CreateInventoryCommand', {
        id,
        productId,
        name,
        description: description || '',
        availableQuantity,
        minStockLevel,
        category,
        correlationId
      });

      res.status(201).json({ message: 'Inventory created successfully', id });
    } catch (error) {
      console.error('Error creating inventory:', error);
      res.status(500).json({ error: 'Failed to create inventory' });
    }
  }

  async reserveStock(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { orderId, productId, quantity } = req.body;
      
      if (!orderId || !productId || !quantity) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const correlationId = req.headers['x-correlation-id'] as string || 'unknown';
      
      await this.commandBus.execute('ReserveStockCommand', {
        inventoryId: id,
        orderId,
        productId,
        quantity,
        correlationId
      });

      res.status(200).json({ message: 'Stock reserved successfully' });
    } catch (error) {
      console.error('Error reserving stock:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to reserve stock' });
    }
  }

  async releaseStock(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { orderId, productId, quantity } = req.body;
      
      if (!orderId || !productId || !quantity) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const correlationId = req.headers['x-correlation-id'] as string || 'unknown';
      
      await this.commandBus.execute('ReleaseStockCommand', {
        inventoryId: id,
        orderId,
        productId,
        quantity,
        correlationId
      });

      res.status(200).json({ message: 'Stock released successfully' });
    } catch (error) {
      console.error('Error releasing stock:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to release stock' });
    }
  }

  async moveToInTransit(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { orderId, productId, quantity } = req.body;
      
      if (!orderId || !productId || !quantity) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const correlationId = req.headers['x-correlation-id'] as string || 'unknown';
      
      await this.commandBus.execute('MoveToInTransitCommand', {
        inventoryId: id,
        orderId,
        productId,
        quantity,
        correlationId
      });

      res.status(200).json({ message: 'Stock moved to in-transit successfully' });
    } catch (error) {
      console.error('Error moving stock to in-transit:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to move stock to in-transit' });
    }
  }

  async updateStock(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { productId, newAvailableQuantity } = req.body;
      
      if (!productId || newAvailableQuantity === undefined) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const correlationId = req.headers['x-correlation-id'] as string || 'unknown';
      
      await this.commandBus.execute('UpdateStockCommand', {
        inventoryId: id,
        productId,
        newAvailableQuantity,
        correlationId
      });

      res.status(200).json({ message: 'Stock updated successfully' });
    } catch (error) {
      console.error('Error updating stock:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to update stock' });
    }
  }

  async deactivateInventory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const correlationId = req.headers['x-correlation-id'] as string || 'unknown';
      
      await this.commandBus.execute('DeactivateInventoryCommand', {
        inventoryId: id,
        correlationId
      });

      res.status(200).json({ message: 'Inventory deactivated successfully' });
    } catch (error) {
      console.error('Error deactivating inventory:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to deactivate inventory' });
    }
  }

  async activateInventory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const correlationId = req.headers['x-correlation-id'] as string || 'unknown';
      
      await this.commandBus.execute('ActivateInventoryCommand', {
        inventoryId: id,
        correlationId
      });

      res.status(200).json({ message: 'Inventory activated successfully' });
    } catch (error) {
      console.error('Error activating inventory:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to activate inventory' });
    }
  }

  async getInventory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const inventory = await this.inventoryRepository.findById(id);
      
      if (!inventory) {
        res.status(404).json({ error: 'Inventory not found' });
        return;
      }

      res.status(200).json(inventory.toSnapshot());
    } catch (error) {
      console.error('Error finding inventory:', error);
      res.status(500).json({ error: 'Failed to find inventory' });
    }
  }

  async getAllInventories(req: Request, res: Response): Promise<void> {
    try {
      const { category, active } = req.query;
      
      let inventories;
      if (category) {
        inventories = await this.inventoryRepository.findByCategory(category as string);
      } else if (active === 'true') {
        inventories = await this.inventoryRepository.findActive();
      } else if (active === 'false') {
        const allInventories = await this.inventoryRepository.findAll();
        inventories = allInventories.filter(inv => !inv.isActive);
      } else {
        inventories = await this.inventoryRepository.findAll();
      }

      res.status(200).json(inventories.map(inv => inv.toSnapshot()));
    } catch (error) {
      console.error('Error finding inventories:', error);
      res.status(500).json({ error: 'Failed to find inventories' });
    }
  }

  async getLowStockInventories(req: Request, res: Response): Promise<void> {
    try {
      const lowStockInventories = await this.inventoryRepository.findLowStock();
      res.status(200).json(lowStockInventories.map(inv => inv.toSnapshot()));
    } catch (error) {
      console.error('Error finding low stock inventories:', error);
      res.status(500).json({ error: 'Failed to find low stock inventories' });
    }
  }
}
