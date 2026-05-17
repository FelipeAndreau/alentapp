import { SportRepository } from '../../domain/sports/SportRepository.js';

export class DeleteSportUseCase {
    constructor(private sportRepository: SportRepository) {}

    async execute(id: string): Promise<void> {
        const sport = await this.sportRepository.findById(id);
        if (!sport) {
            throw new Error('Deporte no encontrado');
        }

        await this.sportRepository.delete(id);
    }
}
