import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteDisciplineUseCase } from './DeleteDisciplineUseCase.js';
import { DisciplineRepository } from '../../domain/disciplines/DisciplineRepository.js';
import { DisciplineNotFoundError } from '../../domain/disciplines/errors/DisciplineErrors.js';
import { DisciplineDTO } from '@alentapp/shared';

describe('DeleteDisciplineUseCase', () => {
    let disciplineRepo: DisciplineRepository;
    let useCase: DeleteDisciplineUseCase;

    const existingDiscipline: DisciplineDTO = {
        id: 'disc-uuid-1',
        reason: 'Conducta antideportiva',
        start_date: '2026-06-01T00:00:00.000Z',
        end_date: '2026-07-01T00:00:00.000Z',
        is_total_suspension: true,
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

        useCase = new DeleteDisciplineUseCase(disciplineRepo);
    });

    it('debe llamar a repository.delete con el id correcto cuando la disciplina existe', async () => {
        vi.mocked(disciplineRepo.findById).mockResolvedValue(existingDiscipline);
        vi.mocked(disciplineRepo.delete).mockResolvedValue(undefined);

        await useCase.execute('disc-uuid-1');

        expect(disciplineRepo.findById).toHaveBeenCalledWith('disc-uuid-1');
        expect(disciplineRepo.delete).toHaveBeenCalledWith('disc-uuid-1');
    });

    it('debe lanzar DisciplineNotFoundError y no llamar a delete cuando la disciplina no existe', async () => {
        vi.mocked(disciplineRepo.findById).mockResolvedValue(null);

        await expect(useCase.execute('nonexistent-id')).rejects.toThrow(DisciplineNotFoundError);
        expect(disciplineRepo.delete).not.toHaveBeenCalled();
    });
});
