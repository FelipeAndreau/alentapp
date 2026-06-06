import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateEnrollmentUseCase } from './UpdateEnrollmentUseCase.js';
import { EnrollmentRepository } from '../../domain/enrollments/EnrollmentRepository.js';
import {
    EnrollmentNotFoundError,
    EnrollmentAlreadyDeletedError,
} from '../../domain/enrollments/errors/EnrollmentErrors.js';
import { EnrollmentDTO } from '@alentapp/shared';

describe('UpdateEnrollmentUseCase', () => {
    let enrollmentRepo: EnrollmentRepository;
    let useCase: UpdateEnrollmentUseCase;

    const activeEnrollment: EnrollmentDTO = {
        id: 'enrollment-1',
        member_id: 'member-1',
        sport_id: 'sport-1',
        enrollment_date: '2026-06-01T00:00:00.000Z',
        is_active: true,
        deleted_at: null,
    };

    const deletedEnrollment: EnrollmentDTO = {
        ...activeEnrollment,
        deleted_at: '2026-06-01T00:00:00.000Z',
        is_active: false,
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

        useCase = new UpdateEnrollmentUseCase(enrollmentRepo);
    });

    it('debe actualizar is_active exitosamente', async () => {
        vi.mocked(enrollmentRepo.findById).mockResolvedValue(activeEnrollment);
        vi.mocked(enrollmentRepo.update).mockResolvedValue({
            ...activeEnrollment,
            is_active: false,
        });

        const result = await useCase.execute('enrollment-1', {
            is_active: false,
        });

        expect(enrollmentRepo.update).toHaveBeenCalledOnce();
        expect(result.is_active).toBe(false);
    });

    it('debe lanzar EnrollmentNotFoundError si la inscripcion no existe', async () => {
        vi.mocked(enrollmentRepo.findById).mockResolvedValue(null);

        await expect(
            useCase.execute('enrollment-inexistente', { is_active: false }),
        ).rejects.toThrow(EnrollmentNotFoundError);

        expect(enrollmentRepo.update).not.toHaveBeenCalled();
    });

    it('debe lanzar EnrollmentAlreadyDeletedError si la inscripcion fue dada de baja', async () => {
        vi.mocked(enrollmentRepo.findById).mockResolvedValue(deletedEnrollment);

        await expect(
            useCase.execute('enrollment-1', { is_active: true }),
        ).rejects.toThrow(EnrollmentAlreadyDeletedError);

        expect(enrollmentRepo.update).not.toHaveBeenCalled();
    });

    it('debe retornar la inscripcion sin cambios si el body esta vacio', async () => {
        vi.mocked(enrollmentRepo.findById).mockResolvedValue(activeEnrollment);

        const result = await useCase.execute('enrollment-1', {});

        expect(enrollmentRepo.update).not.toHaveBeenCalled();
        expect(result).toEqual(activeEnrollment);
    });
});
