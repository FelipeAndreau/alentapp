import { describe, it, expect, vi } from 'vitest';
import { SportValidator } from './SportValidator.js';
import { SportRepository } from '../SportRepository.js';
import { SportNameConflictError } from '../errors/SportErrors.js';

describe('SportValidator', () => {
    describe('validateNameIsUnique', () => {
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
                validator.validateNameIsUnique('Fútbol'),
            ).rejects.toThrow(SportNameConflictError);
        });
    });
});
