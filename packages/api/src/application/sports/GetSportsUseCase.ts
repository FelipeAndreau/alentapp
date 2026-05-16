import { ISportRepository } from '../../domain/sports/ISportRepository.js';
import { SportDTO } from '@alentapp/shared';

export class GetSportsUseCase {
    constructor(private readonly sportRepository: ISportRepository) {}

    async execute(): Promise<SportDTO[]> {
        return this.sportRepository.findAll();
    }
}
