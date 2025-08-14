import { CommandHandler } from './command-bus';
import { ProcessPaymentCommand, CancelPaymentCommand } from '../domain/commands/payment.commands';
import { Payment } from '../domain/payment.aggregate';
import { PaymentRepository } from '../infrastructure/payment.repository';

export class ProcessPaymentHandler implements CommandHandler<ProcessPaymentCommand> {
  constructor(private paymentRepository: PaymentRepository) {}

  async handle(command: ProcessPaymentCommand): Promise<void> {
    console.log(`Processing payment for order: ${command.orderId}, amount: $${command.amount}`);

    // Crear nuevo pago
    const payment = new Payment(
      command.id,
      command.orderId,
      command.amount,
      'USD', // Moneda por defecto para MVP
      'credit_card', // Método de pago por defecto
      command.customerId || 'unknown',
      command.correlationId
    );

    // Procesar el pago (esto dispara PaymentProcessedEvent)
    payment.process();

    // Simular procesamiento de pago (en MVP real sería con gateway de pago)
    console.log(`💳 Processing payment ${payment.id} for order ${command.orderId}`);
    console.log(`💰 Amount: $${command.amount}`);
    
    // Simular confirmación exitosa (90% de éxito para MVP)
    const isSuccessful = Math.random() > 0.1;
    
    if (isSuccessful) {
      payment.confirm();
      console.log(`✅ Payment ${payment.id} confirmed successfully`);
    } else {
      payment.fail('Payment gateway timeout');
      console.log(`❌ Payment ${payment.id} failed: Payment gateway timeout`);
    }

    // Guardar en el repository (esto guarda los eventos)
    await this.paymentRepository.save(payment);

    console.log(`🔗 Correlation ID: ${command.correlationId}`);
    console.log(`📊 Payment status: ${payment.status}`);
  }
}

export class CancelPaymentHandler implements CommandHandler<CancelPaymentCommand> {
  constructor(private paymentRepository: PaymentRepository) {}

  async handle(command: CancelPaymentCommand): Promise<void> {
    console.log(`Cancelling payment: ${command.paymentId}`);

    // Cargar pago desde el repository
    const payment = await this.paymentRepository.findById(command.paymentId);
    if (!payment) {
      throw new Error(`Payment ${command.paymentId} not found`);
    }

    // Solo se pueden cancelar pagos pendientes o en procesamiento
    if (payment.status === 'confirmed' || payment.status === 'failed') {
      throw new Error(`Cannot cancel payment in status: ${payment.status}`);
    }

    // Cancelar el pago (esto dispara PaymentCancelledEvent)
    payment.fail('Payment cancelled by user');

    // Guardar cambios
    await this.paymentRepository.save(payment);

    console.log(`❌ Payment ${command.paymentId} cancelled successfully`);
    console.log(`🔗 Correlation ID: ${command.correlationId}`);
  }
}
