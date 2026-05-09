import { IPaymentRepository } from '../../domain/IPaymentRepository.js';
import { MemberRepository } from '../../domain/MemberRepository.js';
import { CreatePaymentRequest, PaymentDTO } from '@alentapp/shared';

export class CreatePaymentUseCase {
  constructor(
    private readonly paymentRepository: IPaymentRepository,
    private readonly memberRepository: MemberRepository
  ) {}

  async execute(request: CreatePaymentRequest): Promise<PaymentDTO> {

    if (!request.member_id || request.member_id.trim() === '') {
      throw new Error('El ID del socio es obligatorio');
    }

    if (request.amount <= 0) {
      throw new Error('El monto debe ser mayor a 0');
    }

    if (!Number.isInteger(request.month) || request.month < 1 || request.month > 12) {
      throw new Error('El mes debe estar entre 1 y 12');
    }

    const currentYear = new Date().getFullYear();
    if (!Number.isInteger(request.year) || request.year < currentYear) {
      throw new Error('El ano no puede ser en el pasado');
    }

    if (!request.due_date || isNaN(Date.parse(request.due_date))) {
      throw new Error('La fecha de vencimiento es invalida');
    }

    const dueDate = new Date(request.due_date);
    const dueDateMonth = dueDate.getUTCMonth() + 1;
    const dueDateYear = dueDate.getUTCFullYear();

    if (dueDateYear < request.year || (dueDateYear === request.year && dueDateMonth < request.month)) {
      throw new Error('La fecha de vencimiento no puede ser anterior al mes/ano del pago');
    }

    const member = await this.memberRepository.findById(request.member_id);
    if (!member) {
      throw new Error('Socio no encontrado');
    }

    const existingPayments = await this.paymentRepository.findByPeriod(request.member_id, request.month, request.year);
    const hasActivePayment = existingPayments.some(p => p.status === 'Pending' || p.status === 'Paid');
    
    if (hasActivePayment) {
      throw new Error('Ya existe un pago activo (Pending o Paid) para ese periodo');
    }

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
