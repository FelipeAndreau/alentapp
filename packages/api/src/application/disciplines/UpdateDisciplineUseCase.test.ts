import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateDisciplineUseCase } from './UpdateDisciplineUseCase.js';
import { DisciplineRepository } from '../../domain/disciplines/DisciplineRepository.js';
import { DisciplineValidator } from '../../domain/disciplines/services/DisciplineValidator.js';
import { DisciplineNotFoundError } from '../../domain/disciplines/errors/DisciplineErrors.js';
import { DisciplineDTO } from '@alentapp/shared';

describe('UpdateDisciplineUseCase', () => {
    let disciplineRepo: DisciplineRepository;
    let validator: DisciplineValidator;
    let useCase: UpdateDisciplineUseCase;

    const existingDiscipline: DisciplineDTO = {
        id: 'disc-uuid-1',
        reason: 'Motivo original',
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

        validator = {
            validateDates: vi.fn(),
        } as unknown as DisciplineValidator;

        useCase = new UpdateDisciplineUseCase(disciplineRepo, validator);
    });

    it('debe lanzar DisciplineNotFoundError si la disciplina no existe', async () => {
        vi.mocked(disciplineRepo.findById).mockResolvedValue(null);

        await expect(useCase.execute('nonexistent-id', { reason: 'Nuevo motivo' })).rejects.toThrow(
            DisciplineNotFoundError,
        );
        expect(disciplineRepo.update).not.toHaveBeenCalled();
    });

    it('debe retornar la disciplina sin cambios y sin validar fechas cuando el body está vacío', async () => {
        vi.mocked(disciplineRepo.findById).mockResolvedValue(existingDiscipline);
        vi.mocked(disciplineRepo.update).mockResolvedValue(existingDiscipline);

        const result = await useCase.execute('disc-uuid-1', {});

        expect(validator.validateDates).not.toHaveBeenCalled();
        expect(result).toEqual(existingDiscipline);
    });

    it('debe validar las fechas y actualizar la disciplina cuando se modifica end_date', async () => {
        const newEndDate = '2026-08-15T00:00:00.000Z';
        const updatedDiscipline: DisciplineDTO = { ...existingDiscipline, end_date: newEndDate };

        vi.mocked(disciplineRepo.findById).mockResolvedValue(existingDiscipline);
        vi.mocked(disciplineRepo.update).mockResolvedValue(updatedDiscipline);

        const result = await useCase.execute('disc-uuid-1', { end_date: newEndDate });

        expect(validator.validateDates).toHaveBeenCalledWith(
            existingDiscipline.start_date,
            newEndDate,
        );
        expect(result.end_date).toBe(newEndDate);
    });

    it('el member_id es inmutable: se conserva el original después de cualquier actualización', async () => {
        vi.mocked(disciplineRepo.findById).mockResolvedValue(existingDiscipline);
        vi.mocked(disciplineRepo.update).mockImplementation(async (d) => d);

        const result = await useCase.execute('disc-uuid-1', {
            reason: 'Motivo actualizado',
            is_total_suspension: true,
        });

        expect(result.member_id).toBe('member-uuid-1');
    });
});
