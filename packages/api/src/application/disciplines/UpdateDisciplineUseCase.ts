import { DisciplineRepository } from '../../domain/disciplines/DisciplineRepository.js';
import { UpdateDisciplineRequest, DisciplineDTO } from '@alentapp/shared';
import { DisciplineNotFoundError } from '../../domain/disciplines/errors/DisciplineErrors.js';
import { DisciplineValidator } from '../../domain/disciplines/services/DisciplineValidator.js';

export class UpdateDisciplineUseCase {
    constructor(
        private readonly disciplineRepository: DisciplineRepository,
        private readonly disciplineValidator: DisciplineValidator,
    ) {}

    async execute(id: string, data: UpdateDisciplineRequest): Promise<DisciplineDTO> {
        const existing = await this.disciplineRepository.findById(id);
        if (!existing) throw new DisciplineNotFoundError(id);

        if (data.start_date !== undefined || data.end_date !== undefined) {
            const finalStartDate = data.start_date ?? existing.start_date;
            const finalEndDate = data.end_date ?? existing.end_date;
            this.disciplineValidator.validateDates(finalStartDate, finalEndDate);
        }

        const updated: DisciplineDTO = {
            ...existing,
            ...(data.reason !== undefined && { reason: data.reason }),
            ...(data.start_date !== undefined && { start_date: data.start_date }),
            ...(data.end_date !== undefined && { end_date: data.end_date }),
            ...(data.is_total_suspension !== undefined && { is_total_suspension: data.is_total_suspension }),
        };

        return await this.disciplineRepository.update(updated);
    }
}
