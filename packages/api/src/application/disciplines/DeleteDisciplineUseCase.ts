import { IDisciplineRepository } from '../../domain/IDisciplineRepository.js';
import { DisciplineNotFoundError } from '../../domain/errors/DisciplineErrors.js';

export class DeleteDisciplineUseCase {
    constructor(private readonly disciplineRepository: IDisciplineRepository) {}

    async execute(id: string): Promise<void> {
        const existing = await this.disciplineRepository.findById(id);
        if (!existing) throw new DisciplineNotFoundError(id);
        await this.disciplineRepository.delete(id);
    }
}
