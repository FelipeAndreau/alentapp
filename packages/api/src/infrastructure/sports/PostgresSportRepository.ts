import { SportRepository } from '../../domain/sports/SportRepository.js';
import {
    CreateSportRequest,
    UpdateSportRequest,
    SportDTO,
} from '@alentapp/shared';
import { prisma } from '../PrismaClient.js';

export class PostgresSportRepository implements SportRepository {
    async findAll(): Promise<SportDTO[]> {
        const sports = await prisma.sport.findMany({
            where: { deleted_at: null },
        });
        return sports.map((s) => this.mapToDTO(s));
    }

    async findById(id: string): Promise<SportDTO | null> {
        const sport = await prisma.sport.findUnique({
            where: { id, deleted_at: null },
        });
        return sport ? this.mapToDTO(sport) : null;
    }

    async findByName(name: string): Promise<SportDTO | null> {
        const sport = await prisma.sport.findUnique({
            where: { name, deleted_at: null },
        });
        return sport ? this.mapToDTO(sport) : null;
    }

    async create(data: CreateSportRequest): Promise<SportDTO> {
        const sport = await prisma.sport.create({
            data: {
                name: data.name,
                description: data.description,
                max_capacity: data.max_capacity,
                additional_price: data.additional_price,
                requires_medical_certificate: data.requires_medical_certificate,
            },
        });
        return this.mapToDTO(sport);
    }

    async update(id: string, data: UpdateSportRequest): Promise<SportDTO> {
        const sport = await prisma.sport.update({
            where: { id },
            data: {
                description: data.description,
                max_capacity: data.max_capacity,
            },
        });
        return this.mapToDTO(sport);
    }

    async delete(id: string): Promise<void> {
        await prisma.sport.update({
            where: { id },
            data: { deleted_at: new Date() },
        });
    }

    private mapToDTO(sport: any): SportDTO {
        return {
            id: sport.id,
            name: sport.name,
            description: sport.description,
            max_capacity: sport.max_capacity,
            additional_price: sport.additional_price,
            requires_medical_certificate: sport.requires_medical_certificate,
            deleted_at: sport.deleted_at
                ? sport.deleted_at.toISOString()
                : null,
        };
    }
}
