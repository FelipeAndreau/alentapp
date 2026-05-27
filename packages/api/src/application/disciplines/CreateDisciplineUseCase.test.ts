import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateDisciplineUseCase } from './CreateDisciplineUseCase.js';
import { DisciplineRepository } from '../../domain/disciplines/DisciplineRepository.js';
import { MemberRepository } from '../../domain/members/MemberRepository.js';
import { DisciplineValidator } from '../../domain/disciplines/services/DisciplineValidator.js';
import {
    MemberNotFoundForDisciplineError,
    DisciplineValidationError,
} from '../../domain/disciplines/errors/DisciplineErrors.js';
import { DisciplineDTO, CreateDisciplineRequest } from '@alentapp/shared';

describe('CreateDisciplineUseCase', () => {
    let disciplineRepo: DisciplineRepository;
    let memberRepo: MemberRepository;
    let validator: DisciplineValidator;
    let useCase: CreateDisciplineUseCase;

    const validRequest: CreateDisciplineRequest = {
        reason: 'Conducta inapropiada en el partido',
        start_date: '2026-06-01T00:00:00.000Z',
        end_date: '2026-07-01T00:00:00.000Z',
        is_total_suspension: false,
        member_id: 'member-uuid-1',
    };

    const createdDiscipline: DisciplineDTO = {
        id: 'disc-uuid-1',
        reason: 'Conducta inapropiada en el partido',
        start_date: '2026-06-01T00:00:00.000Z',
        end_date: '2026-07-01T00:00:00.000Z',
        is_total_suspension: false,
        member_id: 'member-uuid-1',
    };

    beforeEach(() => {
        disciplineRepo = {
            create: vi.fn(),
            findAll: vi.fn(),
            findById: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        } as unknown as DisciplineRepository;

        memberRepo = {
            findById: vi.fn(),
            findAll: vi.fn(),
            findByDni: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        } as unknown as MemberRepository;

        validator = {
            validateDates: vi.fn(),
        } as unknown as DisciplineValidator;

        useCase = new CreateDisciplineUseCase(disciplineRepo, memberRepo, validator);
    });

    it('debe crear una disciplina cuando el socio existe y las fechas son válidas', async () => {
        vi.mocked(memberRepo.findById).mockResolvedValue({ id: 'member-uuid-1' } as any);
        vi.mocked(disciplineRepo.create).mockResolvedValue(createdDiscipline);

        const result = await useCase.execute(validRequest);

        expect(validator.validateDates).toHaveBeenCalledWith(
            validRequest.start_date,
            validRequest.end_date,
        );
        expect(memberRepo.findById).toHaveBeenCalledWith('member-uuid-1');
        expect(disciplineRepo.create).toHaveBeenCalledWith(validRequest);
        expect(result).toEqual(createdDiscipline);
    });

    it('debe lanzar MemberNotFoundForDisciplineError cuando el socio no existe', async () => {
        vi.mocked(memberRepo.findById).mockResolvedValue(null);

        await expect(useCase.execute(validRequest)).rejects.toThrow(
            MemberNotFoundForDisciplineError,
        );
        expect(disciplineRepo.create).not.toHaveBeenCalled();
    });

    it('debe propagar DisciplineValidationError si el validador rechaza las fechas', async () => {
        vi.mocked(validator.validateDates).mockImplementationOnce(() => {
            throw new DisciplineValidationError(
                'La fecha de fin debe ser posterior a la de inicio',
            );
        });

        await expect(
            useCase.execute({ ...validRequest, end_date: validRequest.start_date }),
        ).rejects.toThrow('La fecha de fin debe ser posterior a la de inicio');

        expect(memberRepo.findById).not.toHaveBeenCalled();
        expect(disciplineRepo.create).not.toHaveBeenCalled();
    });
});
