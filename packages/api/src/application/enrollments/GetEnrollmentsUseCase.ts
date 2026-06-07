// Importa la interfaz del repositorio
import { EnrollmentRepository } from '../../domain/enrollments/EnrollmentRepository.js';

// Importa el tipo de respuesta del shared
import { EnrollmentDTO } from '@alentapp/shared';

export class GetEnrollmentsUseCase {
    constructor(private enrollmentRepository: EnrollmentRepository) {}

    // Sin parámetros — devuelve todas las inscripciones activas
    // La lógica de filtrar deleted_at=null vive en el repositorio, no acá
    async execute(): Promise<EnrollmentDTO[]> {
        return this.enrollmentRepository.findAll();
    }
}
