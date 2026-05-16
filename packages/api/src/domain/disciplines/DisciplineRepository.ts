import { DisciplineDTO, CreateDisciplineRequest } from '@alentapp/shared';

export interface DisciplineRepository {
    create(data: CreateDisciplineRequest): Promise<DisciplineDTO>;
<<<<<<< HEAD:packages/api/src/domain/disciplines/DisciplineRepository.ts
    findAll(): Promise<DisciplineDTO[]>;
=======
    getAll(): Promise<DisciplineDTO[]>;
    findById(id: string): Promise<DisciplineDTO | null>;
    update(data: DisciplineDTO): Promise<DisciplineDTO>;
    delete(id: string): Promise<void>;
>>>>>>> origin/feature/discipline-delete:packages/api/src/domain/IDisciplineRepository.ts
}
