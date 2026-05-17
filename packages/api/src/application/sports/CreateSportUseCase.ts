import { ISportRepository } from '../../domain/sports/ISportRepository.js';
import { CreateSportRequest, SportDTO } from '@alentapp/shared';
import {
    SportNameConflictError,
    SportValidationError,
} from '../../domain/errors/SportErrors.js';

export class CreateSportUseCase {
    constructor(private readonly sportRepository: ISportRepository) {}

    async execute(request: CreateSportRequest): Promise<SportDTO> {
        if (!request.name || request.name.trim() === '') {
            throw new SportValidationError(
                'El nombre del deporte es obligatorio',
            );
        }
        if (request.max_capacity <= 0) {
            throw new SportValidationError(
                'La capacidad máxima debe ser mayor a cero',
            );
        }
        if (request.additional_price < 0) {
            throw new SportValidationError(
                'El precio adicional no puede ser negativo',
            );
        }

        const existing = await this.sportRepository.findByName(request.name);
        if (existing) {
            throw new SportNameConflictError(request.name);
        }

        return this.sportRepository.create(request);
    }
}
