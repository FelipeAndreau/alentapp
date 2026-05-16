import { IDisciplineRepository } from '../../domain/IDisciplineRepository.js';
import { DisciplineDTO } from '@alentapp/shared';

export class GetDisciplinesUseCase {
    constructor(private readonly disciplineRepository: IDisciplineRepository) {}

    async execute(): Promise<DisciplineDTO[]> {
        return await this.disciplineRepository.getAll();
    }
}
