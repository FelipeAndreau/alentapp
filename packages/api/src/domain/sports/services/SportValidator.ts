import { SportRepository } from '../SportRepository.js';
import { SportNameConflictError } from '../errors/SportErrors.js';

export class SportValidator {
    constructor(private sportRepository: SportRepository) {}

    async validateNameIsUnique(name: string): Promise<void> {
        const sport = await this.sportRepository.findByName(name);
        if (sport) {
            throw new SportNameConflictError(name);
        }
    }
}
