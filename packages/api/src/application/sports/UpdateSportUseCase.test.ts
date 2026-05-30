import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateSportUseCase } from './UpdateSportUseCase.js';
import { SportRepository } from '../../domain/sports/SportRepository.js';
import {
    SportNotFoundError,
    SportAlreadyDeletedError,
    SportValidationError,
} from '../../domain/sports/errors/SportErrors.js';
import { SportDTO } from '@alentapp/shared';

describe('UpdateSportUseCase', () => {
    let sportRepo: SportRepository;
    let useCase: UpdateSportUseCase;

    const activeSport: SportDTO = {
        id: 'sport-1',
        name: 'Fútbol',
        description: 'Fútbol 11',
        max_capacity: 22,
        additional_price: 500,
        requires_medical_certificate: false,
        deleted_at: null,
    };

    const deletedSport: SportDTO = {
        ...activeSport,
        deleted_at: '2026-05-01T00:00:00.000Z',
    };

    beforeEach(() => {
        sportRepo = {
            create: vi.fn(),
            findById: vi.fn(),
            findByName: vi.fn(),
            findAll: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        } as unknown as SportRepository;

        useCase = new UpdateSportUseCase(sportRepo);
    });

    it('debe actualizar un deporte exitosamente', async () => {
        vi.mocked(sportRepo.findById).mockResolvedValue(activeSport);
        vi.mocked(sportRepo.update).mockResolvedValue({
            ...activeSport,
            max_capacity: 30,
        });

        const result = await useCase.execute('sport-1', { max_capacity: 30 });

        expect(result.max_capacity).toBe(30);
        expect(sportRepo.update).toHaveBeenCalledOnce();
    });

    it('debe lanzar SportNotFoundError si el deporte no existe', async () => {
        vi.mocked(sportRepo.findById).mockResolvedValue(null);

        await expect(
            useCase.execute('sport-inexistente', { max_capacity: 10 }),
        ).rejects.toThrow(SportNotFoundError);
    });

    it('debe lanzar SportAlreadyDeletedError si el deporte fue dado de baja', async () => {
        vi.mocked(sportRepo.findById).mockResolvedValue(deletedSport);

        await expect(
            useCase.execute('sport-1', { max_capacity: 10 }),
        ).rejects.toThrow(SportAlreadyDeletedError);
    });

    it('debe lanzar SportValidationError si max_capacity es cero o negativo', async () => {
        vi.mocked(sportRepo.findById).mockResolvedValue(activeSport);

        await expect(
            useCase.execute('sport-1', { max_capacity: 0 }),
        ).rejects.toThrow(SportValidationError);
    });
});
