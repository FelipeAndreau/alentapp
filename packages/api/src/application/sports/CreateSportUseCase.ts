import { SportRepository } from '../../domain/sports/SportRepository.js';
import { SportValidator } from '../../domain/sports/services/SportValidator.js';
import { CreateSportRequest, SportDTO } from '@alentapp/shared';

export class CreateSportUseCase {
    constructor(
        private sportRepository: SportRepository,
        private sportValidator: SportValidator,
    ) {}

    async execute(request: CreateSportRequest): Promise<SportDTO> {
        await this.sportValidator.validateCreate(request);
        return this.sportRepository.create(request);
    }
}
