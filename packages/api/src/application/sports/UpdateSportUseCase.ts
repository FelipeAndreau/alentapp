import { SportRepository } from '../../domain/sports/SportRepository.js';
import { SportValidator } from '../../domain/sports/services/SportValidator.js';
import { UpdateSportRequest, SportDTO } from '@alentapp/shared';

export class UpdateSportUseCase {
    constructor(
        private sportRepository: SportRepository,
        private sportValidator: SportValidator,
    ) {}

    async execute(id: string, data: UpdateSportRequest): Promise<SportDTO> {
        const sport = await this.sportRepository.findById(id);
        if (!sport) {
            throw new Error('Deporte no encontrado');
        }

        return await this.sportRepository.update(id, data);
    }
}
