import { DisciplineDTO, CreateDisciplineRequest } from '@alentapp/shared';

export interface DisciplineRepository {
    create(data: CreateDisciplineRequest): Promise<DisciplineDTO>;
    findAll(): Promise<DisciplineDTO[]>;
    findById(id: string): Promise<DisciplineDTO | null>;
    update(data: DisciplineDTO): Promise<DisciplineDTO>;
    delete(id: string): Promise<void>;
}
