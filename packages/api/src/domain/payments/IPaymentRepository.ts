import { PaymentDTO } from '@alentapp/shared';

export interface IPaymentRepository {
  save(payment: Omit<PaymentDTO, 'id' | 'created_at' | 'updated_at'>): Promise<PaymentDTO>;
  findById(id: string): Promise<PaymentDTO | null>;
  findActiveInPeriod(memberId: string, month: number, year: number): Promise<PaymentDTO[]>;
  update(payment: PaymentDTO): Promise<PaymentDTO>;
  findAll(): Promise<PaymentDTO[]>;

}
