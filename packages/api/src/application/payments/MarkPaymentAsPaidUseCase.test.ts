import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MarkPaymentAsPaidUseCase } from './MarkPaymentAsPaidUseCase.js';
import { IPaymentRepository } from '../../domain/payments/IPaymentRepository.js';
import { IClock } from '../../domain/services/Clock.js';
import { PaymentAlreadyCanceledError } from '../../domain/payments/errors/PaymentErrors.js';

describe('MarkPaymentAsPaidUseCase', () => {
  let paymentRepo: IPaymentRepository;
  let clock: IClock;
  let useCase: MarkPaymentAsPaidUseCase;

  const mockDate = new Date('2026-05-25T10:00:00Z');

  beforeEach(() => {
    paymentRepo = {
      findById: vi.fn(),
      update: vi.fn(),
    } as unknown as IPaymentRepository;

    clock = {
      now: vi.fn().mockReturnValue(mockDate),
    };

    useCase = new MarkPaymentAsPaidUseCase(paymentRepo, clock);
  });

  it('debe marcar un pago como pagado exitosamente', async () => {
    const payment = { id: 'p1', status: 'Pending', amount: '100' };
    vi.mocked(paymentRepo.findById).mockResolvedValue(payment as any);
    vi.mocked(paymentRepo.update).mockImplementation(async (p) => p as any);

    const result = await useCase.execute('p1');

    expect(result.status).toBe('Paid');
    expect(result.payment_date).toBe(mockDate.toISOString());
    expect(paymentRepo.update).toHaveBeenCalled();
  });

  it('debe lanzar error si el pago esta cancelado', async () => {
    const payment = { id: 'p1', status: 'Canceled' };
    vi.mocked(paymentRepo.findById).mockResolvedValue(payment as any);

    await expect(useCase.execute('p1')).rejects.toThrow(PaymentAlreadyCanceledError);
  });
});
