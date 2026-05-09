import { IPaymentRepository } from '../../domain/IPaymentRepository.js';
import { PaymentDTO } from '@alentapp/shared';

export class UpdatePaymentUseCase {
  constructor(private readonly paymentRepository: IPaymentRepository) {}

  async execute(paymentId: string, data: Partial<PaymentDTO>): Promise<PaymentDTO> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) throw new Error('Pago no encontrado');
    
    if (payment.status !== 'Pending') {
      throw new Error('Solo se pueden modificar pagos en estado Pending');
    }

    if (data.amount !== undefined) payment.amount = data.amount;
    if (data.due_date !== undefined) payment.due_date = data.due_date;
    
    return await this.paymentRepository.update(payment);
  }
}
