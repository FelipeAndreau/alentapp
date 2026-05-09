import { IPaymentRepository } from '../../domain/IPaymentRepository.js';
import { IClock } from '../../domain/services/Clock.js';
import { PaymentDTO } from '@alentapp/shared';

export class MarkPaymentAsPaidUseCase {
  constructor(
    private readonly paymentRepository: IPaymentRepository,
    private readonly clock: IClock
  ) {}

  async execute(paymentId: string): Promise<PaymentDTO> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new Error('Pago no encontrado');
    }

    // Idempotencia: Si ya está pagado, retornamos éxito sin mutar ni arrojar error
    if (payment.status === 'Paid') {
      return payment;
    }

    // Regla de negocio
    if (payment.status === 'Canceled') {
      throw new Error('No se puede cobrar un pago que ha sido anulado');
    }

    // Actualizamos estado e inyectamos la fecha del sistema (o del mock en tests)
    payment.status = 'Paid';
    payment.payment_date = this.clock.now().toISOString();

    return await this.paymentRepository.update(payment);
  }
}
