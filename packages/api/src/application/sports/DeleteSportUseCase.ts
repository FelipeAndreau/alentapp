import { ISportRepository } from '../../domain/sports/ISportRepository.js';
import { SportDTO } from '@alentapp/shared';
import {
    SportNotFoundError,
    SportAlreadyDeletedError,
} from '../../domain/errors/SportErrors.js';

export class DeleteSportUseCase {
    constructor(private readonly sportRepository: ISportRepository) {}

    async execute(id: string): Promise<SportDTO> {
        const existing = await this.sportRepository.findById(id);
        if (!existing) {
            throw new SportNotFoundError();
        }
        if (existing.deleted_at !== null) {
            throw new SportAlreadyDeletedError();
        }

        return await this.sportRepository.softDelete(id);
    }
}
