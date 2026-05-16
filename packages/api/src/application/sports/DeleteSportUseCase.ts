import { ISportRepository } from '../../domain/sports/ISportRepository.js';
import { SportDTO } from '@alentapp/shared';

export class DeleteSportUseCase {
    constructor(private readonly sportRepository: ISportRepository) {}

    async execute(id: string): Promise<SportDTO> {
        // Verificar que el deporte existe
        const existing = await this.sportRepository.findById(id);
        if (!existing) {
            throw new Error('El deporte no existe');
        }

        // Verificar que no fue dado de baja previamente
        if (existing.deleted_at !== null) {
            throw new Error('El deporte ya fue dado de baja');
        }

        // Soft delete
        return await this.sportRepository.softDelete(id);
    }
}
