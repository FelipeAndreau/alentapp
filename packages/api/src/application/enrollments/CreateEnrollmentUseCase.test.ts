import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateEnrollmentUseCase } from './CreateEnrollmentUseCase.js';
import { EnrollmentRepository } from '../../domain/enrollments/EnrollmentRepository.js';
import { EnrollmentValidator } from '../../domain/enrollments/services/EnrollmentValidator.js';
import {
    EnrollmentValidationError,
    EnrollmentDuplicateError,
    EnrollmentCapacityError,
    EnrollmentMemberInactiveError,
} from '../../domain/enrollments/errors/EnrollmentErrors.js';
import { EnrollmentDTO } from '@alentapp/shared';

describe('CreateEnrollmentUseCase', () => {
    let enrollmentRepo: EnrollmentRepository;
    let enrollmentValidator: EnrollmentValidator;
    let useCase: CreateEnrollmentUseCase;

    const createdEnrollment: EnrollmentDTO = {
        id: 'enrollment-1',
        member_id: 'member-1',
        sport_id: 'sport-1',
        enrollment_date: '2026-06-01T00:00:00.000Z',
        is_active: true,
        deleted_at: null,
    };

    beforeEach(() => {
        enrollmentRepo = {
            create: vi.fn(),
            findById: vi.fn(),
            findAll: vi.fn(),
            findActiveByMemberAndSport: vi.fn(),
            countActiveBySportId: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        } as unknown as EnrollmentRepository;

        enrollmentValidator = {
            validateCreate: vi.fn(),
        } as unknown as EnrollmentValidator;

        useCase = new CreateEnrollmentUseCase(
            enrollmentRepo,
            enrollmentValidator,
        );
    });

    it('debe crear una inscripcion exitosamente', async () => {
        vi.mocked(enrollmentValidator.validateCreate).mockResolvedValue(
            undefined,
        );
        vi.mocked(enrollmentRepo.create).mockResolvedValue(createdEnrollment);

        const result = await useCase.execute({
            member_id: 'member-1',
            sport_id: 'sport-1',
        });

        expect(enrollmentValidator.validateCreate).toHaveBeenCalledOnce();
        expect(enrollmentRepo.create).toHaveBeenCalledOnce();
        expect(result.id).toBe('enrollment-1');
        expect(result.is_active).toBe(true);
        expect(result.deleted_at).toBeNull();
    });

    it('debe lanzar EnrollmentValidationError si member_id esta vacio', async () => {
        vi.mocked(enrollmentValidator.validateCreate).mockRejectedValue(
            new EnrollmentValidationError('El campo member_id es obligatorio'),
        );

        await expect(
            useCase.execute({ member_id: '', sport_id: 'sport-1' }),
        ).rejects.toThrow(EnrollmentValidationError);

        expect(enrollmentRepo.create).not.toHaveBeenCalled();
    });

    it('debe lanzar EnrollmentDuplicateError si ya existe una inscripcion activa', async () => {
        vi.mocked(enrollmentValidator.validateCreate).mockRejectedValue(
            new EnrollmentDuplicateError(),
        );

        await expect(
            useCase.execute({ member_id: 'member-1', sport_id: 'sport-1' }),
        ).rejects.toThrow(EnrollmentDuplicateError);

        expect(enrollmentRepo.create).not.toHaveBeenCalled();
    });

    it('debe lanzar EnrollmentCapacityError si el deporte no tiene cupo', async () => {
        vi.mocked(enrollmentValidator.validateCreate).mockRejectedValue(
            new EnrollmentCapacityError(),
        );

        await expect(
            useCase.execute({ member_id: 'member-1', sport_id: 'sport-1' }),
        ).rejects.toThrow(EnrollmentCapacityError);

        expect(enrollmentRepo.create).not.toHaveBeenCalled();
    });
});
