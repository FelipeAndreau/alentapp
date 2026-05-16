import { ISportRepository } from '../domain/sports/ISportRepository.js';
import {
    CreateSportRequest,
    UpdateSportRequest,
    SportDTO,
} from '@alentapp/shared';
import { prisma } from './PrismaClient.js';

export class PostgresSportRepository implements ISportRepository {
    async create(data: CreateSportRequest): Promise<SportDTO> {
        const sport = await prisma.sport.create({
            data: {
                name: data.name,
                description: data.description ?? null,
                max_capacity: data.max_capacity,
                additional_price: data.additional_price,
                requires_medical_certificate: data.requires_medical_certificate,
                deleted_at: null,
            },
        });
        return this.mapToDTO(sport);
    }

    async findById(id: string): Promise<SportDTO | null> {
        const sport = await prisma.sport.findUnique({ where: { id } });
        return sport ? this.mapToDTO(sport) : null;
    }

    async findByName(name: string): Promise<SportDTO | null> {
        const sport = await prisma.sport.findUnique({ where: { name } });
        return sport ? this.mapToDTO(sport) : null;
    }

    async findAll(): Promise<SportDTO[]> {
        const sports = await prisma.sport.findMany({
            where: { deleted_at: null },
            orderBy: { name: 'asc' },
        });
        return sports.map((s) => this.mapToDTO(s));
    }

    async update(id: string, data: UpdateSportRequest): Promise<SportDTO> {
        const sport = await prisma.sport.update({
            where: { id },
            data: {
                ...(data.description !== undefined && {
                    description: data.description,
                }),
                ...(data.max_capacity !== undefined && {
                    max_capacity: data.max_capacity,
                }),
            },
        });
        return this.mapToDTO(sport);
    }

    async softDelete(id: string): Promise<SportDTO> {
        const sport = await prisma.sport.update({
            where: { id },
            data: { deleted_at: new Date() },
        });
        return this.mapToDTO(sport);
    }

    private mapToDTO(sport: any): SportDTO {
        return {
            id: sport.id,
            name: sport.name,
            description: sport.description ?? undefined,
            max_capacity: sport.max_capacity,
            additional_price: sport.additional_price,
            requires_medical_certificate: sport.requires_medical_certificate,
            deleted_at: sport.deleted_at
                ? sport.deleted_at.toISOString()
                : null,
        };
    }
}
