import { IPaymentRepository } from '../../domain/payments/IPaymentRepository.js';
import { PaymentDTO } from '@alentapp/shared';
import { PaymentNotFoundError, PaymentAlreadyPaidError } from '../../domain/payments/errors/PaymentErrors.js';

export class CancelPaymentUseCase {
  constructor(
    private readonly paymentRepository: IPaymentRepository
  ) {}

  async execute(paymentId: string): Promise<PaymentDTO> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new PaymentNotFoundError();
    }

    if (payment.status === 'Canceled') {
      return payment;
    }

    if (payment.status === 'Paid') {
      throw new PaymentAlreadyPaidError();
    }

    const updatedPayment = {
      ...payment,
      status: 'Canceled' as const,
    };

    return await this.paymentRepository.update(updatedPayment);
  }
}
