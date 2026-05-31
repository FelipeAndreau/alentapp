import { SportRepository } from '../../domain/sports/SportRepository.js';
import { SportValidator } from '../../domain/sports/services/SportValidator.js';
import { UpdateSportRequest, SportDTO } from '@alentapp/shared';
import {
    SportNotFoundError,
    SportAlreadyDeletedError,
} from '../../domain/sports/errors/SportErrors.js';

export class UpdateSportUseCase {
    constructor(
        private readonly sportRepository: SportRepository,
        private readonly sportValidator: SportValidator,
    ) {}

    async execute(id: string, request: UpdateSportRequest): Promise<SportDTO> {
        const existing = await this.sportRepository.findById(id);
        if (!existing) {
            throw new SportNotFoundError();
        }
        if (existing.deleted_at !== null) {
            throw new SportAlreadyDeletedError();
        }

        await this.sportValidator.validateUpdate(id, request);

        return this.sportRepository.update(id, request);
    }
}
