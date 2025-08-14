import { CommandHandler } from './command-bus';
import { CreateOrderCommand, ConfirmOrderCommand, CancelOrderCommand } from '../domain/commands/order.commands';
import { Order } from '../domain/order.aggregate';
import { OrderRepository } from '../infrastructure/order.repository';
import { ProductRepository } from '../infrastructure/product.repository';

export class CreateOrderHandler implements CommandHandler<CreateOrderCommand> {
  constructor(
    private orderRepository: OrderRepository,
    private productRepository: ProductRepository
  ) {}

  async handle(command: CreateOrderCommand): Promise<void> {
    console.log(`Creating order: ${command.id} for customer: ${command.customerId}`);

    // Obtener productos reales de la base de datos
    const productIds = command.items.map(item => item.productId);
    const products = await this.productRepository.findByIds(productIds);
    
    if (products.length !== productIds.length) {
      const foundIds = products.map(p => p.id);
      const missingIds = productIds.filter(id => !foundIds.includes(id));
      throw new Error(`Products not found: ${missingIds.join(', ')}`);
    }

    // Calcular precios reales basados en el catálogo
    const itemsWithPrice: Array<{ productId: string; quantity: number; price: number }> = [];
    let totalAmount = 0;

    for (const item of command.items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        // Esto no debería ocurrir gracias a la validación anterior, pero es una buena práctica
        throw new Error(`Product ${item.productId} not found`);
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;
      itemsWithPrice.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price
      });

      console.log(`Adding ${item.quantity}x ${product.name} at $${product.price} each = $${itemTotal}`);
    }

    // Crear nueva orden con precios reales
    const order = new Order(
      command.id,
      command.customerId,
      itemsWithPrice,
      command.correlationId
    );

    // Guardar en el repository (esto guarda los eventos)
    await this.orderRepository.save(order);

    console.log(`✅ Order ${command.id} created successfully with ${command.items.length} items`);
    console.log(`💰 Total amount: $${totalAmount.toFixed(2)}`);
    console.log(`🔗 Correlation ID: ${command.correlationId}`);
  }
}

export class ConfirmOrderHandler implements CommandHandler<ConfirmOrderCommand> {
  constructor(private orderRepository: OrderRepository) {}

  async handle(command: ConfirmOrderCommand): Promise<void> {
    console.log(`Confirming order: ${command.orderId}`);

    // Cargar orden desde el repository
    const order = await this.orderRepository.findById(command.orderId);
    if (!order) {
      throw new Error(`Order ${command.orderId} not found`);
    }

    // Confirmar la orden (esto dispara OrderConfirmedEvent)
    order.confirm();

    // Guardar cambios
    await this.orderRepository.save(order);

    console.log(`✅ Order ${command.orderId} confirmed successfully`);
    console.log(`💰 Total confirmed: $${order.totalAmount}`);
    console.log(`🔗 Correlation ID: ${command.correlationId}`);
  }
}

export class CancelOrderHandler implements CommandHandler<CancelOrderCommand> {
  constructor(
    private orderRepository: OrderRepository,
    private productRepository: ProductRepository
  ) {}

  async handle(command: CancelOrderCommand): Promise<void> {
    console.log(`Cancelling order: ${command.orderId}`);

    // Cargar orden desde el repository
    const order = await this.orderRepository.findById(command.orderId);
    if (!order) {
      throw new Error(`Order ${command.orderId} not found`);
    }

    // La liberación de stock ahora es responsabilidad del InventoryService,
    // que escuchará el evento OrderCancelledEvent.
    // Ya no se maneja directamente aquí.
    // for (const item of order.items) {
    //   await this.productRepository.releaseStock(item.productId, item.quantity);
    //   console.log(`🔄 Released ${item.quantity}x ${item.productId} back to stock`);
    // }

    // Cancelar la orden (esto dispara OrderCancelledEvent)
    order.cancel();

    // Guardar cambios
    await this.orderRepository.save(order);

    console.log(`❌ Order ${command.orderId} cancelled successfully`);
    console.log(`🔗 Correlation ID: ${command.correlationId}`);
  }
}
