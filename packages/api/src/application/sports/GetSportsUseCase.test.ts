import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetSportsUseCase } from './GetSportsUseCase.js';
import { SportRepository } from '../../domain/sports/SportRepository.js';
import { SportDTO } from '@alentapp/shared';

describe('GetSportsUseCase', () => {
    let sportRepo: SportRepository;
    let useCase: GetSportsUseCase;

    beforeEach(() => {
        sportRepo = {
            create: vi.fn(),
            findById: vi.fn(),
            findByName: vi.fn(),
            findAll: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        } as unknown as SportRepository;

        useCase = new GetSportsUseCase(sportRepo);
    });

    it('debe retornar la lista de deportes activos obtenida del repositorio', async () => {
        const sports: SportDTO[] = [
            {
                id: 'sport-1',
                name: 'Fútbol',
                description: 'Fútbol 11',
                max_capacity: 22,
                additional_price: 500,
                requires_medical_certificate: false,
                deleted_at: null,
            },
            {
                id: 'sport-2',
                name: 'Tenis',
                description: 'Cancha de polvo',
                max_capacity: 4,
                additional_price: 150,
                requires_medical_certificate: false,
                deleted_at: null,
            },
        ];

        vi.mocked(sportRepo.findAll).mockResolvedValue(sports);

        const result = await useCase.execute();

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('Fútbol');
        expect(sportRepo.findAll).toHaveBeenCalledOnce();
    });

    it('debe retornar un array vacío cuando no hay deportes activos', async () => {
        vi.mocked(sportRepo.findAll).mockResolvedValue([]);

        const result = await useCase.execute();

        expect(result).toHaveLength(0);
        expect(Array.isArray(result)).toBe(true);
    });
});
