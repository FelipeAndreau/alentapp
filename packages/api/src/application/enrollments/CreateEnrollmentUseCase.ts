// Importa la interfaz del repositorio — el caso de uso nunca conoce PostgresEnrollmentRepository
import { EnrollmentRepository } from '../../domain/enrollments/EnrollmentRepository.js';

// Importa el validator que contiene todas las reglas de negocio del create
import { EnrollmentValidator } from '../../domain/enrollments/services/EnrollmentValidator.js';

// Importa los tipos del paquete shared — el DTO de respuesta y el request de entrada
import { CreateEnrollmentRequest, EnrollmentDTO } from '@alentapp/shared';

export class CreateEnrollmentUseCase {
    // Recibe sus dependencias desde afuera (inyección de dependencias)
    // nunca las instancia él mismo
    constructor(
        private enrollmentRepository: EnrollmentRepository,
        private enrollmentValidator: EnrollmentValidator,
    ) {}

    // Método principal — recibe el request del controller y devuelve el DTO creado
    async execute(request: CreateEnrollmentRequest): Promise<EnrollmentDTO> {
        // Delega TODAS las validaciones al validator
        // Si algo falla, lanza un error tipado que el global handler convierte a HTTP
        await this.enrollmentValidator.validateCreate(request);

        // Si las validaciones pasan, persiste via el repositorio (interfaz)
        // El repositorio se encarga de generar enrollment_date automáticamente
        return this.enrollmentRepository.create(request);
    }
}
