import { IPaymentRepository } from '../domain/IPaymentRepository.js';
import { PaymentDTO, PaymentStatus } from '@alentapp/shared';
import { prisma } from './PrismaClient.js';

export class PostgresPaymentRepository implements IPaymentRepository {
    async save(payment: Omit<PaymentDTO, 'id' | 'created_at' | 'updated_at'>): Promise<PaymentDTO> {
        const saved = await prisma.payment.create({
            data: {
                amount: payment.amount,
                month: payment.month,
                year: payment.year,
                status: payment.status,
                due_date: new Date(payment.due_date),
                payment_date: payment.payment_date ? new Date(payment.payment_date) : null,
                member_id: payment.member_id,
            }
        });
        return this.mapToDTO(saved);
    }

    async findById(id: string): Promise<PaymentDTO | null> {
        const payment = await prisma.payment.findUnique({ where: { id } });
        return payment ? this.mapToDTO(payment) : null;
    }

    async findActiveInPeriod(memberId: string, month: number, year: number): Promise<PaymentDTO[]> {
        const payments = await prisma.payment.findMany({
            where: {
                member_id: memberId,
                month,
                year,
                status: { in: ['Pending', 'Paid'] }
            }
        });
        return payments.map(p => this.mapToDTO(p));
    }

    async findAll(): Promise<PaymentDTO[]> {
        const payments = await prisma.payment.findMany({
            orderBy: { created_at: 'desc' }
        });
        return payments.map(p => this.mapToDTO(p));
    }

    async update(payment: PaymentDTO): Promise<PaymentDTO> {
        const updated = await prisma.payment.update({
            where: { id: payment.id },
            data: {
                amount: payment.amount,
                status: payment.status,
                due_date: new Date(payment.due_date),
                payment_date: payment.payment_date ? new Date(payment.payment_date) : null,
            }
        });
        return this.mapToDTO(updated);
    }

    private mapToDTO(payment: any): PaymentDTO {
        return {
            id: payment.id,
            amount: payment.amount.toString(),
            month: payment.month,
            year: payment.year,
            status: payment.status as PaymentStatus,
            due_date: payment.due_date.toISOString().split('T')[0],
            payment_date: payment.payment_date ? payment.payment_date.toISOString() : null,
            member_id: payment.member_id,
            created_at: payment.created_at.toISOString(),
            updated_at: payment.updated_at.toISOString(),
        };
    }
}
