import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreatePaymentUseCase } from './CreatePaymentUseCase.js';
import { IPaymentRepository } from '../../domain/payments/IPaymentRepository.js';
import { MemberRepository } from '../../domain/members/MemberRepository.js';
import { 
  MemberNotFoundError, 
  InactiveMemberError, 
  DuplicateActivePaymentError 
} from '../../domain/payments/errors/PaymentErrors.js';

describe('CreatePaymentUseCase', () => {
  let paymentRepo: IPaymentRepository;
  let memberRepo: MemberRepository;
  let useCase: CreatePaymentUseCase;

  beforeEach(() => {
    paymentRepo = {
      save: vi.fn(),
      findById: vi.fn(),
      findActiveInPeriod: vi.fn(),
      update: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn(),
    } as unknown as IPaymentRepository;

    memberRepo = {
      findById: vi.fn(),
    } as unknown as MemberRepository;

    useCase = new CreatePaymentUseCase(paymentRepo, memberRepo);
  });

  it('debe crear un pago exitosamente', async () => {
    const request = {
      amount: '1000',
      month: 12,
      year: 2026,
      due_date: '2026-12-15',
      member_id: 'member-123'
    };

    vi.mocked(memberRepo.findById).mockResolvedValue({ id: 'member-123', status: 'Activo' } as any);
    vi.mocked(paymentRepo.findActiveInPeriod).mockResolvedValue([]);
    vi.mocked(paymentRepo.save).mockResolvedValue({ id: 'pay-1', ...request, status: 'Pending' } as any);

    const result = await useCase.execute(request);

    expect(result.id).toBe('pay-1');
    expect(paymentRepo.save).toHaveBeenCalled();
  });

  it('debe lanzar error si el socio no existe', async () => {
    vi.mocked(memberRepo.findById).mockResolvedValue(null);

    await expect(useCase.execute({
      amount: '1000',
      month: 12,
      year: 2026,
      due_date: '2026-12-15',
      member_id: 'non-existent'
    })).rejects.toThrow(MemberNotFoundError);
  });

  it('debe lanzar error si el socio esta suspendido', async () => {
    vi.mocked(memberRepo.findById).mockResolvedValue({ id: 'm1', status: 'Suspendido' } as any);

    await expect(useCase.execute({
      amount: '1000',
      month: 12,
      year: 2026,
      due_date: '2026-12-15',
      member_id: 'm1'
    })).rejects.toThrow(InactiveMemberError);
  });

  it('debe lanzar error si ya existe un pago activo en el periodo', async () => {
    vi.mocked(memberRepo.findById).mockResolvedValue({ id: 'm1', status: 'Activo' } as any);
    vi.mocked(paymentRepo.findActiveInPeriod).mockResolvedValue([{ id: 'existing-pay' } as any]);

    await expect(useCase.execute({
      amount: '1000',
      month: 12,
      year: 2026,
      due_date: '2026-12-15',
      member_id: 'm1'
    })).rejects.toThrow(DuplicateActivePaymentError);
  });
});
