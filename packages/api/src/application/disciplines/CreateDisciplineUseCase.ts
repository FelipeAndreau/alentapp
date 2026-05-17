import { IDisciplineRepository } from '../../domain/IDisciplineRepository.js';
import { MemberRepository } from '../../domain/MemberRepository.js';
import { CreateDisciplineRequest, DisciplineDTO } from '@alentapp/shared';
import { MemberNotFoundForDisciplineError } from '../../domain/errors/DisciplineErrors.js';
import { DisciplineValidator } from '../../domain/services/DisciplineValidator.js';

export class CreateDisciplineUseCase {
    constructor(
        private readonly disciplineRepository: IDisciplineRepository,
        private readonly memberRepository: MemberRepository,
    ) {}

    async execute(data: CreateDisciplineRequest): Promise<DisciplineDTO> {
        DisciplineValidator.validateDates(data.start_date, data.end_date);

        const member = await this.memberRepository.findById(data.member_id);
        if (!member) {
            throw new MemberNotFoundForDisciplineError(data.member_id);
        }

        return await this.disciplineRepository.create(data);
    }
}
