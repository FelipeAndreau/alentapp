import { SportRepository } from '../SportRepository.js';

export class SportValidator {
    constructor(private sportRepository: SportRepository) {}

    async validateNameIsUnique(name: string): Promise<void> {
        const sport = await this.sportRepository.findByName(name);
        if (sport) {
            throw new Error('Ya existe un deporte con ese nombre');
        }
    }
}
