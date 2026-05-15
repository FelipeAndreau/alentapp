import { describe, it, expect, vi } from 'vitest';
import { MarkPaymentAsPaidUseCase } from './MarkPaymentAsPaidUseCase.js';
import { IPaymentRepository } from '../../domain/IPaymentRepository.js';
import { IClock } from '../../domain/services/Clock.js';
import { PaymentDTO } from '@alentapp/shared';

describe('MarkPaymentAsPaidUseCase', () => {
    it('Debe ser IDEMPOTENTE: Si el pago ya está en estado Paid, debe retornar el pago sin modificar la fecha original y sin llamar a la BD', async () => {
        // Arrange
        const originalPaymentDate = new Date('2026-05-01T10:00:00Z');
        
        // Mock del Reloj que simula que hoy es 10 de Mayo
        const mockClock: IClock = {
            now: () => new Date('2026-05-10T10:00:00Z')
        };

        const existingPayment: PaymentDTO = {
            id: '123',
            amount: 500,
            month: 4,
            year: 2026,
            status: 'Paid', // YA ESTÁ PAGADO PREVIAMENTE
            due_date: '2026-04-10',
            payment_date: originalPaymentDate.toISOString(), // Se pagó el 1 de Mayo
            member_id: 'member-123',
            created_at: '2026-04-01T00:00:00Z',
            updated_at: '2026-05-01T10:00:00Z'
        };

        const mockRepository: IPaymentRepository = {
            save: vi.fn(),
            findById: vi.fn().mockResolvedValue(existingPayment),
            findByPeriod: vi.fn(),
            update: vi.fn(),
        };

        const useCase = new MarkPaymentAsPaidUseCase(mockRepository, mockClock);

        // Act
        // El usuario (o un reintento de red) manda a cobrar de nuevo el mismo pago
        const result = await useCase.execute('123');

        // Assert
        // 1. El estado sigue siendo Paid
        expect(result.status).toBe('Paid');
        
        // 2. La fecha de pago NO SE ACTUALIZÓ al 10 de Mayo, se mantuvo la original del 1 de Mayo
        expect(result.payment_date).toBe(originalPaymentDate.toISOString());

        // 3. El método update de la BD NUNCA fue llamado (ahorro de recursos de infraestructura)
        expect(mockRepository.update).not.toHaveBeenCalled();
    });
});
