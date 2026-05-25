import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CancelPaymentUseCase } from './CancelPaymentUseCase.js';
import { IPaymentRepository } from '../../domain/payments/IPaymentRepository.js';

describe('CancelPaymentUseCase', () => {
  let paymentRepo: IPaymentRepository;
  let useCase: CancelPaymentUseCase;

  beforeEach(() => {
    paymentRepo = {
      findById: vi.fn(),
      update: vi.fn(),
    } as unknown as IPaymentRepository;

    useCase = new CancelPaymentUseCase(paymentRepo);
  });

  it('debe anular un pago exitosamente', async () => {
    const payment = { id: 'p1', status: 'Pending' };
    vi.mocked(paymentRepo.findById).mockResolvedValue(payment as any);
    vi.mocked(paymentRepo.update).mockImplementation(async (p) => p as any);

    const result = await useCase.execute('p1');

    expect(result.status).toBe('Canceled');
    expect(paymentRepo.update).toHaveBeenCalled();
  });
});
