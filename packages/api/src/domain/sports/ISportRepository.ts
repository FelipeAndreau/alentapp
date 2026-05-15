import {
    SportDTO,
    CreateSportRequest,
    UpdateSportRequest,
} from '@alentapp/shared';

export interface ISportRepository {
    create(data: CreateSportRequest): Promise<SportDTO>;
    update(id: string, data: UpdateSportRequest): Promise<SportDTO>;
    findById(id: string): Promise<SportDTO | null>;
    findByName(name: string): Promise<SportDTO | null>;
    findAll(): Promise<SportDTO[]>;
    softDelete(id: string): Promise<void>;
}
