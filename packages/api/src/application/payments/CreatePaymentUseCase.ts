import { IPaymentRepository } from '../../domain/IPaymentRepository.js';
import { MemberRepository } from '../../domain/MemberRepository.js';
import { CreatePaymentRequest, PaymentDTO } from '@alentapp/shared';
import { 
  PaymentValidationError, 
  MemberNotFoundError, 
  DuplicateActivePaymentError,
  InactiveMemberError 
} from '../../domain/errors/PaymentErrors.js';
import { PaymentValidator } from '../../domain/services/PaymentValidator.js';

export class CreatePaymentUseCase {
  constructor(
    private readonly paymentRepository: IPaymentRepository,
    private readonly memberRepository: MemberRepository
  ) {}

  async execute(request: CreatePaymentRequest): Promise<PaymentDTO> {

    if (!request.member_id || request.member_id.trim() === '') {
      throw new PaymentValidationError('El ID del socio es obligatorio');
    }

    PaymentValidator.validateAmount(request.amount);
    PaymentValidator.validatePeriod(request.month, request.year);
    PaymentValidator.validateDueDate(request.due_date, request.month, request.year);

    const member = await this.memberRepository.findById(request.member_id);
    if (!member) {
      throw new MemberNotFoundError(request.member_id);
    }

    if (member.status === 'Suspendido') {
      throw new InactiveMemberError();
    }

    const activePayments = await this.paymentRepository.findActiveInPeriod(request.member_id, request.month, request.year);
    
    if (activePayments.length > 0) {
      throw new DuplicateActivePaymentError();
    }

    const newPayment = await this.paymentRepository.save({
      amount: request.amount,
      month: request.month,
      year: request.year,
      status: 'Pending',
      due_date: request.due_date,
      payment_date: null,
      member_id: request.member_id,
    });

    return newPayment;
  }
}
