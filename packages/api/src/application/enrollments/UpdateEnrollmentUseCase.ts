import { EnrollmentRepository } from '../../domain/enrollments/EnrollmentRepository.js';
import { UpdateEnrollmentRequest, EnrollmentDTO } from '@alentapp/shared';
import {
    EnrollmentNotFoundError,
    EnrollmentAlreadyDeletedError,
} from '../../domain/enrollments/errors/EnrollmentErrors.js';

export class UpdateEnrollmentUseCase {
    constructor(private enrollmentRepository: EnrollmentRepository) {}

    async execute(
        id: string,
        request: UpdateEnrollmentRequest,
    ): Promise<EnrollmentDTO> {
        // Busca la inscripción por ID — findById filtra deleted_at=null
        // Si no existe (o fue dada de baja) devuelve null
        const existing = await this.enrollmentRepository.findById(id);

        // Si no existe lanza error 404
        if (!existing) {
            throw new EnrollmentNotFoundError();
        }

        // Doble chequeo explícito — si está dada de baja no se puede modificar
        if (existing.deleted_at !== null) {
            throw new EnrollmentAlreadyDeletedError();
        }

        // Si el body está vacío, devuelve la inscripción sin cambios (200 OK sin tocar la DB)
        if (Object.keys(request).length === 0) {
            return existing;
        }

        // Fusiona los campos originales con los nuevos
        // Los campos inmutables (member_id, sport_id, enrollment_date) se conservan del original
        // Solo is_active puede cambiar
        return this.enrollmentRepository.update(id, request);
    }
}
