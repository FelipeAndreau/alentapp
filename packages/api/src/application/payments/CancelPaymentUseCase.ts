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

    if (payment.status === 'Canceled') {
      return payment;
    }

    if (payment.status === 'Paid') {
      throw new Error('No se puede anular un pago que ya fue cobrado');
    }

    payment.status = 'Canceled';
    payment.payment_date = null;

    return await this.paymentRepository.update(payment);
  }
}
