import { DisciplineRepository } from '../../domain/disciplines/DisciplineRepository.js';
import { DisciplineNotFoundError } from '../../domain/disciplines/errors/DisciplineErrors.js';

export class DeleteDisciplineUseCase {
    constructor(private readonly disciplineRepository: DisciplineRepository) {}

    async execute(id: string): Promise<void> {
        const existing = await this.disciplineRepository.findById(id);
        if (!existing) throw new DisciplineNotFoundError(id);
        await this.disciplineRepository.delete(id);
    }
}
