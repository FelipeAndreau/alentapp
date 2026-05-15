import { IPaymentRepository } from '../../domain/payments/IPaymentRepository.js';
import { PaymentDTO } from '@alentapp/shared';

export class GetPaymentsUseCase {
    constructor(private paymentRepository: IPaymentRepository) {}

    async execute(): Promise<PaymentDTO[]> {
        return this.paymentRepository.findAll();
    }
}
