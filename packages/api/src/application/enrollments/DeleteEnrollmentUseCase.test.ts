import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteEnrollmentUseCase } from './DeleteEnrollmentUseCase.js';
import { EnrollmentRepository } from '../../domain/enrollments/EnrollmentRepository.js';
import {
    EnrollmentNotFoundError,
    EnrollmentAlreadyDeletedError,
} from '../../domain/enrollments/errors/EnrollmentErrors.js';
import { EnrollmentDTO } from '@alentapp/shared';

describe('DeleteEnrollmentUseCase', () => {
    let enrollmentRepo: EnrollmentRepository;
    let useCase: DeleteEnrollmentUseCase;

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

        useCase = new DeleteEnrollmentUseCase(enrollmentRepo);
    });

    it('debe dar de baja una inscripcion exitosamente y retornar el DTO con deleted_at y is_active=false', async () => {
        vi.mocked(enrollmentRepo.findById).mockResolvedValue(activeEnrollment);
        vi.mocked(enrollmentRepo.delete).mockResolvedValue(deletedEnrollment);

        const result = await useCase.execute('enrollment-1');

        expect(enrollmentRepo.delete).toHaveBeenCalledWith('enrollment-1');
        expect(result.deleted_at).not.toBeNull();
        expect(result.is_active).toBe(false);
    });

    it('debe lanzar EnrollmentNotFoundError si la inscripcion no existe', async () => {
        vi.mocked(enrollmentRepo.findById).mockResolvedValue(null);

        await expect(useCase.execute('enrollment-inexistente')).rejects.toThrow(
            EnrollmentNotFoundError,
        );

        expect(enrollmentRepo.delete).not.toHaveBeenCalled();
    });

    it('debe lanzar EnrollmentAlreadyDeletedError si la inscripcion ya fue dada de baja', async () => {
        vi.mocked(enrollmentRepo.findById).mockResolvedValue(deletedEnrollment);

        await expect(useCase.execute('enrollment-1')).rejects.toThrow(
            EnrollmentAlreadyDeletedError,
        );

        expect(enrollmentRepo.delete).not.toHaveBeenCalled();
    });
});
