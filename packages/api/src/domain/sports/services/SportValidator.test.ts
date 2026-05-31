import { describe, it, expect, vi } from 'vitest';
import { SportValidator } from './SportValidator.js';
import { SportRepository } from '../SportRepository.js';
import {
    SportNameConflictError,
    SportValidationError,
} from '../errors/SportErrors.js';

describe('SportValidator', () => {
    describe('validateCreate', () => {
        it('debe lanzar SportValidationError si el nombre está vacío', async () => {
            const sportRepo = {
                findByName: vi.fn().mockResolvedValue(null),
            } as unknown as SportRepository;

            const validator = new SportValidator(sportRepo);

            await expect(
                validator.validateCreate({
                    name: '',
                    max_capacity: 10,
                    additional_price: 0,
                    requires_medical_certificate: false,
                }),
            ).rejects.toThrow(SportValidationError);
        });

        it('debe lanzar SportValidationError si max_capacity es cero o negativo', async () => {
            const sportRepo = {
                findByName: vi.fn().mockResolvedValue(null),
            } as unknown as SportRepository;

            const validator = new SportValidator(sportRepo);

            await expect(
                validator.validateCreate({
                    name: 'Tenis',
                    max_capacity: 0,
                    additional_price: 0,
                    requires_medical_certificate: false,
                }),
            ).rejects.toThrow(SportValidationError);
        });

        it('debe lanzar SportNameConflictError si ya existe un deporte con ese nombre', async () => {
            const sportRepo = {
                findByName: vi.fn().mockResolvedValue({
                    id: 'sport-1',
                    name: 'Fútbol',
                    max_capacity: 22,
                    additional_price: 0,
                    requires_medical_certificate: false,
                    deleted_at: null,
                }),
            } as unknown as SportRepository;

            const validator = new SportValidator(sportRepo);

            await expect(
                validator.validateCreate({
                    name: 'Fútbol',
                    max_capacity: 10,
                    additional_price: 0,
                    requires_medical_certificate: false,
                }),
            ).rejects.toThrow(SportNameConflictError);
        });
    });

    describe('validateUpdate', () => {
        it('debe lanzar SportValidationError si max_capacity es cero o negativo', async () => {
            const sportRepo = {} as unknown as SportRepository;
            const validator = new SportValidator(sportRepo);

            await expect(
                validator.validateUpdate('sport-1', { max_capacity: 0 }),
            ).rejects.toThrow(SportValidationError);
        });

        it('debe lanzar SportValidationError si la descripción está vacía', async () => {
            const sportRepo = {} as unknown as SportRepository;
            const validator = new SportValidator(sportRepo);

            await expect(
                validator.validateUpdate('sport-1', { description: '' }),
            ).rejects.toThrow(SportValidationError);
        });
    });
});
