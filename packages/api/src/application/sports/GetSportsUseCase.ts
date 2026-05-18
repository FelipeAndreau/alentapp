import { SportRepository } from '../../domain/sports/SportRepository.js';
import { SportDTO } from '@alentapp/shared';

export class GetSportsUseCase {
    constructor(private sportRepository: SportRepository) {}

    async execute(): Promise<SportDTO[]> {
        return await this.sportRepository.findAll();
    }
}
