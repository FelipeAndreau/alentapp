import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { DisciplineValidator } from '../domain/services/DisciplineValidator.js';
import { DisciplineDTO, CreateDisciplineRequest } from '@alentapp/shared';

export class CreateDisciplineUseCase {
    constructor(
        private readonly disciplineRepository: DisciplineRepository,
        private readonly memberRepository: MemberRepository,
        private readonly disciplineValidator: DisciplineValidator,
    ) {}

    async execute(data: CreateDisciplineRequest): Promise<DisciplineDTO> {
        this.disciplineValidator.validateDates(data.start_date, data.end_date);

        const member = await this.memberRepository.findById(data.member_id);
        if (!member) {
            throw new Error('No existe un socio con ese ID');
        }

        return await this.disciplineRepository.create(data);
    }
}
