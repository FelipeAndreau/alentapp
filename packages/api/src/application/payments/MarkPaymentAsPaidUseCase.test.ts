import { describe, it, expect, vi } from 'vitest';
import { MarkPaymentAsPaidUseCase } from './MarkPaymentAsPaidUseCase.js';
import { IPaymentRepository } from '../../domain/payments/IPaymentRepository.js';
import { IClock } from '../../domain/services/Clock.js';
import { PaymentDTO } from '@alentapp/shared';

describe('MarkPaymentAsPaidUseCase', () => {
    it('Debe ser IDEMPOTENTE: Si el pago ya está en estado Paid, debe retornar el pago sin modificar la fecha original y sin llamar a la BD', async () => {
        const originalPaymentDate = new Date('2026-05-01T10:00:00Z');
        
        const mockClock: IClock = {
            now: () => new Date('2026-05-10T10:00:00Z')
        };

        const existingPayment: PaymentDTO = {
            id: '123',
            amount: 500,
            month: 4,
            year: 2026,
            status: 'Paid',
            due_date: '2026-04-10',
            payment_date: originalPaymentDate.toISOString(),
            member_id: 'member-123',
            created_at: '2026-04-01T00:00:00Z',
            updated_at: '2026-05-01T10:00:00Z'
        };

        const mockRepository: IPaymentRepository = {
            save: vi.fn(),
            findById: vi.fn().mockResolvedValue(existingPayment),
            update: vi.fn(),
            findAll: vi.fn()
        };

        const useCase = new MarkPaymentAsPaidUseCase(mockRepository, mockClock);

        const result = await useCase.execute('123');

        expect(result.status).toBe('Paid');
        
        expect(result.payment_date).toBe(originalPaymentDate.toISOString());

        expect(mockRepository.update).not.toHaveBeenCalled();
    });
});
