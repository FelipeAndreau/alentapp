import { DisciplineRepository } from '../../domain/disciplines/DisciplineRepository.js';
import { DisciplineDTO, CreateDisciplineRequest } from '@alentapp/shared';
import { prisma } from '../../infrastructure/PrismaClient.js';

type DBDiscipline = {
    id: string;
    reason: string;
    start_date: Date;
    end_date: Date;
    is_total_suspension: boolean;
    member_id: string;
    deleted_at: Date | null;
};

export class PostgresDisciplineRepository implements DisciplineRepository {
    async create(data: CreateDisciplineRequest): Promise<DisciplineDTO> {
        const discipline = await prisma.discipline.create({
            data: {
                reason: data.reason,
                start_date: new Date(data.start_date),
                end_date: new Date(data.end_date),
                is_total_suspension: data.is_total_suspension,
                member_id: data.member_id,
            },
        });

        return this.mapToDTO(discipline);
    }

    async findAll(): Promise<DisciplineDTO[]> {
        const disciplines = await prisma.discipline.findMany({
            where: { deleted_at: null },
            orderBy: { start_date: 'desc' }
        });
        return disciplines.map(d => this.mapToDTO(d));
    }

<<<<<<< HEAD:packages/api/src/infrastructure/disciplines/PostgresDisciplineRepository.ts
    private mapToDTO(discipline: DBDiscipline): DisciplineDTO {
=======
    async findById(id: string): Promise<DisciplineDTO | null> {
        const discipline = await prisma.discipline.findFirst({
            where: { id, deleted_at: null },
        });
        if (!discipline) return null;
        return this.mapToDTO(discipline);
    }

    async update(data: DisciplineDTO): Promise<DisciplineDTO> {
        const discipline = await prisma.discipline.update({
            where: { id: data.id },
            data: {
                reason: data.reason,
                start_date: new Date(data.start_date),
                end_date: new Date(data.end_date),
                is_total_suspension: data.is_total_suspension,
            },
        });
        return this.mapToDTO(discipline);
    }

    async delete(id: string): Promise<void> {
        await prisma.discipline.update({ where: { id }, data: { deleted_at: new Date() } });
    }

    private mapToDTO(discipline: any): DisciplineDTO {
>>>>>>> origin/feature/discipline-delete:packages/api/src/infrastructure/PostgresDisciplineRepository.ts
        return {
            id: discipline.id,
            reason: discipline.reason,
            start_date: discipline.start_date.toISOString(),
            end_date: discipline.end_date.toISOString(),
            is_total_suspension: discipline.is_total_suspension,
            member_id: discipline.member_id,
        };
    }
}
