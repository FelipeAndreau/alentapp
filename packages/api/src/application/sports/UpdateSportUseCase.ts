import { ISportRepository } from '../../domain/sports/ISportRepository.js';
import { SportValidator } from '../../domain/services/SportValidator.js';
import { UpdateSportRequest, SportDTO } from '@alentapp/shared';

export class UpdateSportUseCase {
    constructor(
        private readonly sportRepository: ISportRepository,
        private readonly sportValidator: SportValidator,
    ) {}

    async execute(id: string, request: UpdateSportRequest): Promise<SportDTO> {
        // Verificar que el deporte existe y está activo
        const existing = await this.sportRepository.findById(id);
        if (!existing) {
            throw new Error('El deporte no existe');
        }
        if (existing.deleted_at !== null) {
            throw new Error('No se puede modificar un deporte eliminado');
        }

        // Validaciones de los campos enviados
        if (request.max_capacity !== undefined) {
            SportValidator.validateMaxCapacity(request.max_capacity);
        }
        if (
            request.description !== undefined &&
            request.description.trim() === ''
        ) {
            throw new Error('La descripción no puede ser un texto vacío');
        }

        // Persistir
        return this.sportRepository.update(id, request);
    }
}
