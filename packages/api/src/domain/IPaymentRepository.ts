import { PaymentDTO } from '@alentapp/shared';

export interface IPaymentRepository {
  save(payment: Omit<PaymentDTO, 'id' | 'created_at' | 'updated_at'>): Promise<PaymentDTO>;
  findById(id: string): Promise<PaymentDTO | null>;
  findByPeriod(memberId: string, month: number, year: number): Promise<PaymentDTO[]>;
  update(payment: PaymentDTO): Promise<PaymentDTO>;
  // NOTA ARQUITECTÓNICA: Por política de Inmutabilidad, NO incluimos método delete()
}
