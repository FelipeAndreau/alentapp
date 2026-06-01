import { SportRepository } from '../SportRepository.js';
import {
    SportNameConflictError,
    SportValidationError,
} from '../errors/SportErrors.js';
import { CreateSportRequest, UpdateSportRequest } from '@alentapp/shared';

export class SportValidator {
    constructor(private sportRepository: SportRepository) {}

    async validateCreate(request: CreateSportRequest): Promise<void> {
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
    }

    async validateUpdate(
        id: string,
        request: UpdateSportRequest,
    ): Promise<void> {
        if (
            request.description !== undefined &&
            request.description.trim() === ''
        ) {
            throw new SportValidationError(
                'La descripción no puede ser un texto vacío',
            );
        }
        if (
            request.max_capacity !== undefined &&
            request.max_capacity <= 0
        ) {
            throw new SportValidationError(
                'La capacidad máxima debe ser mayor a cero',
            );
        }
    }
}
