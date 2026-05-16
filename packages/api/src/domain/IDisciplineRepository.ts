import { DisciplineDTO, CreateDisciplineRequest } from '@alentapp/shared';

export interface IDisciplineRepository {
    create(data: CreateDisciplineRequest): Promise<DisciplineDTO>;
    getAll(): Promise<DisciplineDTO[]>;
    findById(id: string): Promise<DisciplineDTO | null>;
    update(data: DisciplineDTO): Promise<DisciplineDTO>;
    delete(id: string): Promise<void>;
}
