import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteSportUseCase } from './DeleteSportUseCase.js';
import { SportRepository } from '../../domain/sports/SportRepository.js';
import {
    SportNotFoundError,
    SportAlreadyDeletedError,
} from '../../domain/sports/errors/SportErrors.js';
import { SportDTO } from '@alentapp/shared';

describe('DeleteSportUseCase', () => {
    let sportRepo: SportRepository;
    let useCase: DeleteSportUseCase;

    const activeSport: SportDTO = {
        id: 'sport-1',
        name: 'Tenis',
        description: 'Cancha de polvo de ladrillo',
        max_capacity: 4,
        additional_price: 150,
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

        useCase = new DeleteSportUseCase(sportRepo);
    });

    it('debe dar de baja un deporte exitosamente y retornar el DTO con deleted_at', async () => {
        vi.mocked(sportRepo.findById).mockResolvedValue(activeSport);
        vi.mocked(sportRepo.delete).mockResolvedValue(undefined);

        const result = await useCase.execute('sport-1');

        expect(sportRepo.delete).toHaveBeenCalledWith('sport-1');
        expect(result.deleted_at).not.toBeNull();
        expect(result.name).toBe('Tenis');
    });

    it('debe lanzar SportNotFoundError si el deporte no existe', async () => {
        vi.mocked(sportRepo.findById).mockResolvedValue(null);

        await expect(useCase.execute('sport-inexistente')).rejects.toThrow(
            SportNotFoundError,
        );

        expect(sportRepo.delete).not.toHaveBeenCalled();
    });

    it('debe lanzar SportAlreadyDeletedError si el deporte ya fue dado de baja', async () => {
        vi.mocked(sportRepo.findById).mockResolvedValue(deletedSport);

        await expect(useCase.execute('sport-1')).rejects.toThrow(
            SportAlreadyDeletedError,
        );

        expect(sportRepo.delete).not.toHaveBeenCalled();
    });
});
