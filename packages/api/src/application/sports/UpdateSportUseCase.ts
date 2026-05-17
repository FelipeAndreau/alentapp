import { SportRepository } from '../../domain/sports/SportRepository.js';
import { UpdateSportRequest, SportDTO } from '@alentapp/shared';
import {
    SportNotFoundError,
    SportAlreadyDeletedError,
    SportValidationError,
} from '../../domain/sports/errors/SportErrors.js';

export class UpdateSportUseCase {
    constructor(private readonly sportRepository: SportRepository) {}

    async execute(id: string, request: UpdateSportRequest): Promise<SportDTO> {
        const existing = await this.sportRepository.findById(id);
        if (!existing) {
            throw new SportNotFoundError();
        }
        if (existing.deleted_at !== null) {
            throw new SportAlreadyDeletedError();
        }

        if (request.max_capacity !== undefined && request.max_capacity <= 0) {
            throw new SportValidationError(
                'La capacidad máxima debe ser mayor a cero',
            );
        }
        if (
            request.description !== undefined &&
            request.description.trim() === ''
        ) {
            throw new SportValidationError(
                'La descripción no puede ser un texto vacío',
            );
        }

        return this.sportRepository.update(id, request);
    }
}
