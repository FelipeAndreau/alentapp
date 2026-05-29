import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetDisciplinesUseCase } from './GetDisciplinesUseCase.js';
import { DisciplineRepository } from '../../domain/disciplines/DisciplineRepository.js';
import { DisciplineDTO } from '@alentapp/shared';

describe('GetDisciplinesUseCase', () => {
    let disciplineRepo: DisciplineRepository;
    let useCase: GetDisciplinesUseCase;

    beforeEach(() => {
        disciplineRepo = {
            create: vi.fn(),
            findAll: vi.fn(),
            findById: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        } as unknown as DisciplineRepository;

        useCase = new GetDisciplinesUseCase(disciplineRepo);
    });

    it('debe retornar la lista de disciplinas obtenida del repositorio', async () => {
        const mockDisciplines: DisciplineDTO[] = [
            {
                id: 'disc-1',
                reason: 'Agresión verbal',
                start_date: '2026-05-01T00:00:00.000Z',
                end_date: '2026-06-01T00:00:00.000Z',
                is_total_suspension: false,
                member_id: 'member-1',
            },
            {
                id: 'disc-2',
                reason: 'Violencia en el campo',
                start_date: '2026-04-01T00:00:00.000Z',
                end_date: '2026-05-01T00:00:00.000Z',
                is_total_suspension: true,
                member_id: 'member-2',
            },
        ];

        vi.mocked(disciplineRepo.findAll).mockResolvedValue(mockDisciplines);

        const result = await useCase.execute();

        expect(disciplineRepo.findAll).toHaveBeenCalledOnce();
        expect(result).toEqual(mockDisciplines);
        expect(result).toHaveLength(2);
    });

    it('debe retornar un array vacío cuando no hay disciplinas activas', async () => {
        vi.mocked(disciplineRepo.findAll).mockResolvedValue([]);

        const result = await useCase.execute();

        expect(disciplineRepo.findAll).toHaveBeenCalledOnce();
        expect(result).toEqual([]);
    });
});
