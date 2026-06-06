// Importa el cliente de Prisma — es el objeto que habla con PostgreSQL
import { prisma } from '../PrismaClient.js';

// Importa la interfaz que esta clase implementa — el puerto del dominio
import { EnrollmentRepository } from '../../domain/enrollments/EnrollmentRepository.js';

// Importa los tipos del shared — lo que devuelve cada método
import {
    EnrollmentDTO,
    CreateEnrollmentRequest,
    UpdateEnrollmentRequest,
} from '@alentapp/shared';

import { Enrollment } from '../../generated/client/index.js';

export class PostgresEnrollmentRepository implements EnrollmentRepository {
    // Convierte el objeto de Prisma al DTO del shared
    // Prisma devuelve sus propios tipos internos — este método los traduce
    private mapToDTO(enrollment: Enrollment): EnrollmentDTO {
        return {
            id: enrollment.id,
            member_id: enrollment.member_id,
            sport_id: enrollment.sport_id,
            // toISOString() convierte DateTime de Prisma a string ISO 8601
            enrollment_date: enrollment.enrollment_date.toISOString(),
            is_active: enrollment.is_active,
            // deleted_at puede ser null — si tiene valor lo convierte a string
            deleted_at: enrollment.deleted_at
                ? enrollment.deleted_at.toISOString()
                : null,
        };
    }

    // Inserta una nueva inscripción en la DB
    // enrollment_date, is_active y deleted_at tienen defaults en el schema
    // por eso no los mandamos — Prisma los genera automáticamente
    async create(data: CreateEnrollmentRequest): Promise<EnrollmentDTO> {
        const enrollment = await prisma.enrollment.create({
            data: {
                member_id: data.member_id,
                sport_id: data.sport_id,
                // enrollment_date: @default(now()) en schema — Prisma lo genera
                // is_active: @default(true) en schema — Prisma lo genera
                // deleted_at: null por defecto — no hace falta mandarlo
            },
        });
        return this.mapToDTO(enrollment);
    }

    // Busca una inscripción por ID
    // Solo devuelve inscripciones NO dadas de baja (deleted_at = null)
    // Si fue dada de baja es como si no existiera
    async findById(id: string): Promise<EnrollmentDTO | null> {
        const enrollment = await prisma.enrollment.findFirst({
            where: {
                id,
                deleted_at: null, // filtra las dadas de baja
            },
        });
        return enrollment ? this.mapToDTO(enrollment) : null;
    }

    // Devuelve todas las inscripciones activas (no dadas de baja)
    async findAll(): Promise<EnrollmentDTO[]> {
        const enrollments = await prisma.enrollment.findMany({
            where: { deleted_at: null },
        });
        return enrollments.map((e) => this.mapToDTO(e));
    }

    // Busca si ya existe una inscripción ACTIVA para ese par member+sport
    // Se usa en el validator para detectar duplicados
    // is_active=true Y deleted_at=null = inscripción operativa
    async findActiveByMemberAndSport(
        memberId: string,
        sportId: string,
    ): Promise<EnrollmentDTO | null> {
        const enrollment = await prisma.enrollment.findFirst({
            where: {
                member_id: memberId,
                sport_id: sportId,
                is_active: true,
                deleted_at: null,
            },
        });
        return enrollment ? this.mapToDTO(enrollment) : null;
    }

    // Cuenta cuántas inscripciones activas tiene un deporte
    // Se usa en el validator para verificar el cupo disponible
    async countActiveBySportId(sportId: string): Promise<number> {
        return prisma.enrollment.count({
            where: {
                sport_id: sportId,
                is_active: true,
                deleted_at: null,
            },
        });
    }

    // Actualiza solo is_active — los demás campos son inmutables
    async update(
        id: string,
        data: UpdateEnrollmentRequest,
    ): Promise<EnrollmentDTO> {
        const enrollment = await prisma.enrollment.update({
            where: { id },
            data: {
                // solo toca is_active si viene en el request
                ...(data.is_active !== undefined && {
                    is_active: data.is_active,
                }),
            },
        });
        return this.mapToDTO(enrollment);
    }

    // Soft delete — NO borra el registro
    // Setea deleted_at con la fecha actual del servidor
    // Setea is_active=false para que no cuente en cupo ni duplicados
    // Devuelve el DTO actualizado (a diferencia de Sport que devuelve void)
    async delete(id: string): Promise<EnrollmentDTO> {
        const enrollment = await prisma.enrollment.update({
            where: { id },
            data: {
                deleted_at: new Date(), // fecha actual del servidor
                is_active: false,
            },
        });
        return this.mapToDTO(enrollment);
    }
}
