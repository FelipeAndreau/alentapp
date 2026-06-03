import { EnrollmentRepository } from '../../domain/enrollments/EnrollmentRepository.js';
import { EnrollmentDTO } from '@alentapp/shared';
import {
    EnrollmentNotFoundError,
    EnrollmentAlreadyDeletedError,
} from '../../domain/enrollments/errors/EnrollmentErrors.js';

export class DeleteEnrollmentUseCase {
    constructor(private enrollmentRepository: EnrollmentRepository) {}

    async execute(id: string): Promise<EnrollmentDTO> {
        // Busca la inscripción — si no existe devuelve null
        const existing = await this.enrollmentRepository.findById(id);

        // Si no existe lanza 404
        if (!existing) {
            throw new EnrollmentNotFoundError();
        }

        // Si ya fue dada de baja lanza 409
        if (existing.deleted_at !== null) {
            throw new EnrollmentAlreadyDeletedError();
        }

        // Ejecuta el soft delete — el repositorio setea deleted_at + is_active=false
        // A diferencia de Sport, acá el repositorio devuelve el DTO actualizado
        // porque softDelete en Enrollment devuelve Promise<EnrollmentDTO>
        return this.enrollmentRepository.delete(id);
    }
}
