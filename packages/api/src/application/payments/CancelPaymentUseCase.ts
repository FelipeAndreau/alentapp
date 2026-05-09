import { IPaymentRepository } from '../../domain/IPaymentRepository.js';
import { PaymentDTO } from '@alentapp/shared';

export class CancelPaymentUseCase {
  constructor(
    private readonly paymentRepository: IPaymentRepository
  ) {}

  async execute(paymentId: string): Promise<PaymentDTO> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new Error('Pago no encontrado');
    }

    // Idempotencia: Si ya está anulado, no hacemos nada y devolvemos 200 OK implícito
    if (payment.status === 'Canceled') {
      return payment;
    }

    // Regla de negocio: Auditoría prohíbe anular lo ya ingresado
    if (payment.status === 'Paid') {
      throw new Error('No se puede anular un pago que ya fue cobrado');
    }

    // Baja lógica
    payment.status = 'Canceled';
    payment.payment_date = null; // Limpiamos si hubiese algo

    return await this.paymentRepository.update(payment);
  }
}
