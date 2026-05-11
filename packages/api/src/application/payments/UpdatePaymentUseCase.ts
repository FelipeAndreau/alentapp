import { IPaymentRepository } from '../../domain/IPaymentRepository.js';
import { PaymentDTO } from '@alentapp/shared';
import { PaymentNotFoundError, PaymentNotModifiableError } from '../../domain/errors/PaymentErrors.js';
import { PaymentValidator } from '../../domain/services/PaymentValidator.js';

export class UpdatePaymentUseCase {
  constructor(private readonly paymentRepository: IPaymentRepository) {}

  async execute(paymentId: string, data: Partial<PaymentDTO>): Promise<PaymentDTO> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) throw new PaymentNotFoundError();
    
    if (payment.status !== 'Pending') {
      throw new PaymentNotModifiableError();
    }

    if (data.amount !== undefined) {
      PaymentValidator.validateAmount(data.amount);
    }
    
    if (data.due_date !== undefined) {
      PaymentValidator.validateDueDate(data.due_date, payment.month, payment.year);
    }
    
    const updatedPayment = {
      ...payment,
      ...(data.amount !== undefined && { amount: data.amount }),
      ...(data.due_date !== undefined && { due_date: data.due_date }),
    };
    
    return await this.paymentRepository.update(updatedPayment);
  }
}
