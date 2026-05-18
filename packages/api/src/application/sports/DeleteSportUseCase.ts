import { SportRepository } from '../../domain/sports/SportRepository.js';
import { SportDTO } from '@alentapp/shared';
import {
    SportNotFoundError,
    SportAlreadyDeletedError,
} from '../../domain/sports/errors/SportErrors.js';

export class DeleteSportUseCase {
    constructor(private sportRepository: SportRepository) {}

    async execute(id: string): Promise<SportDTO> {
        const existing = await this.sportRepository.findById(id);
        if (!existing) {
            throw new SportNotFoundError();
        }
        if (existing.deleted_at !== null) {
            throw new SportAlreadyDeletedError();
        }

        await this.sportRepository.delete(id);
        return { ...existing, deleted_at: new Date().toISOString() };
    }
}
