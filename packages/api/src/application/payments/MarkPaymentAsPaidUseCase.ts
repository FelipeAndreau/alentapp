import { IPaymentRepository } from '../../domain/payments/IPaymentRepository.js';
import { IClock } from '../../domain/services/Clock.js';
import { PaymentDTO } from '@alentapp/shared';
import { PaymentNotFoundError, PaymentAlreadyCanceledError } from '../../domain/payments/errors/PaymentErrors.js';

export class MarkPaymentAsPaidUseCase {
  constructor(
    private readonly paymentRepository: IPaymentRepository,
    private readonly clock: IClock
  ) {}

  async execute(paymentId: string): Promise<PaymentDTO> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new PaymentNotFoundError();
    }

    if (payment.status === 'Paid') {
      return payment;
    }

    if (payment.status === 'Canceled') {
      throw new PaymentAlreadyCanceledError();
    }

    const updatedPayment = {
      ...payment,
      status: 'Paid' as const,
      payment_date: this.clock.now().toISOString(),
    };

    return await this.paymentRepository.update(updatedPayment);
  }
}
