import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateSportUseCase } from './CreateSportUseCase.js';
import { SportRepository } from '../../domain/sports/SportRepository.js';
import {
    SportValidationError,
    SportNameConflictError,
} from '../../domain/sports/errors/SportErrors.js';

describe('CreateSportUseCase', () => {
    let sportRepo: SportRepository;
    let useCase: CreateSportUseCase;

    beforeEach(() => {
        sportRepo = {
            create: vi.fn(),
            findById: vi.fn(),
            findByName: vi.fn(),
            findAll: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        } as unknown as SportRepository;

        useCase = new CreateSportUseCase(sportRepo);
    });

    it('debe crear un deporte exitosamente', async () => {
        const request = {
            name: 'Fútbol',
            description: 'Fútbol 11 en cancha de césped',
            max_capacity: 22,
            additional_price: 500,
            requires_medical_certificate: false,
        };

        vi.mocked(sportRepo.findByName).mockResolvedValue(null);
        vi.mocked(sportRepo.create).mockResolvedValue({
            id: 'sport-1',
            ...request,
            deleted_at: null,
        });

        const result = await useCase.execute(request);

        expect(result.id).toBe('sport-1');
        expect(result.name).toBe('Fútbol');
        expect(sportRepo.create).toHaveBeenCalledOnce();
    });

    it('debe lanzar SportValidationError si el nombre está vacío', async () => {
        await expect(
            useCase.execute({
                name: '',
                max_capacity: 10,
                additional_price: 0,
                requires_medical_certificate: false,
            }),
        ).rejects.toThrow(SportValidationError);
    });

    it('debe lanzar SportValidationError si max_capacity es cero o negativo', async () => {
        await expect(
            useCase.execute({
                name: 'Tenis',
                max_capacity: 0,
                additional_price: 0,
                requires_medical_certificate: false,
            }),
        ).rejects.toThrow(SportValidationError);
    });

    it('debe lanzar SportNameConflictError si el nombre ya existe', async () => {
        vi.mocked(sportRepo.findByName).mockResolvedValue({
            id: 'sport-existing',
            name: 'Fútbol',
            max_capacity: 22,
            additional_price: 500,
            requires_medical_certificate: false,
            deleted_at: null,
        });

        await expect(
            useCase.execute({
                name: 'Fútbol',
                max_capacity: 10,
                additional_price: 0,
                requires_medical_certificate: false,
            }),
        ).rejects.toThrow(SportNameConflictError);
    });
});
