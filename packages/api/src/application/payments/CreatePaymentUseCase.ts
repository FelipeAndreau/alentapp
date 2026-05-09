import { IPaymentRepository } from '../../domain/IPaymentRepository.js';
import { MemberRepository } from '../../domain/MemberRepository.js';
import { CreatePaymentRequest, PaymentDTO } from '@alentapp/shared';

export class CreatePaymentUseCase {
  constructor(
    private readonly paymentRepository: IPaymentRepository,
    private readonly memberRepository: MemberRepository
  ) {}

  async execute(request: CreatePaymentRequest): Promise<PaymentDTO> {
    // 1. Validaciones de negocio (Caja Negra / Filtro de entrada)
    if (request.amount <= 0) {
      throw new Error('El monto debe ser mayor a 0');
    }
    if (request.month < 1 || request.month > 12) {
      throw new Error('El mes debe estar entre 1 y 12');
    }
    const currentYear = new Date().getFullYear();
    if (request.year < currentYear) {
      throw new Error('El año no puede ser en el pasado');
    }

    // 2. Validar existencia del socio
    const member = await this.memberRepository.findById(request.member_id);
    if (!member) {
      throw new Error('Socio no encontrado');
    }

    // 3. Regla de Oro: no duplicar para el mismo mes/año si ya hay uno Pending o Paid
    const existingPayments = await this.paymentRepository.findByPeriod(request.member_id, request.month, request.year);
    const hasActivePayment = existingPayments.some(p => p.status === 'Pending' || p.status === 'Paid');
    
    if (hasActivePayment) {
      throw new Error('Ya existe un pago activo (Pending o Paid) para ese periodo');
    }

    // 4. Persistir (Status inicial Pending)
    const newPayment = await this.paymentRepository.save({
      amount: request.amount,
      month: request.month,
      year: request.year,
      status: 'Pending',
      due_date: request.due_date,
      payment_date: null,
      member_id: request.member_id
    });

    return newPayment;
  }
}
