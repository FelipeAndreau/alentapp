// FastifyRequest y FastifyReply son los tipos de Fastify para request y respuesta HTTP
import { FastifyRequest, FastifyReply } from 'fastify';

// Importa los 4 casos de uso — el controller los orquesta según la ruta HTTP
import { CreateEnrollmentUseCase } from '../../application/enrollments/CreateEnrollmentUseCase.js';
import { GetEnrollmentsUseCase } from '../../application/enrollments/GetEnrollmentsUseCase.js';
import { UpdateEnrollmentUseCase } from '../../application/enrollments/UpdateEnrollmentUseCase.js';
import { DeleteEnrollmentUseCase } from '../../application/enrollments/DeleteEnrollmentUseCase.js';

// Importa los tipos del shared para tipar el body de los requests
import {
    CreateEnrollmentRequest,
    UpdateEnrollmentRequest,
} from '@alentapp/shared';

export class EnrollmentController {
    // Recibe los 4 casos de uso por inyección de dependencias
    constructor(
        private createEnrollmentUseCase: CreateEnrollmentUseCase,
        private getEnrollmentsUseCase: GetEnrollmentsUseCase,
        private updateEnrollmentUseCase: UpdateEnrollmentUseCase,
        private deleteEnrollmentUseCase: DeleteEnrollmentUseCase,
    ) {}

    // GET /api/v1/enrollments
    // No recibe body — devuelve todas las inscripciones activas
    async getAll(request: FastifyRequest, reply: FastifyReply) {
        const enrollments = await this.getEnrollmentsUseCase.execute();
        return reply.status(200).send({ data: enrollments });
    }

    // POST /api/v1/enrollments
    // Recibe body tipado como CreateEnrollmentRequest (member_id, sport_id)
    // Si el useCase lanza un error, se propaga al global error handler de app.ts
    async create(
        request: FastifyRequest<{ Body: CreateEnrollmentRequest }>,
        reply: FastifyReply,
    ) {
        const enrollment = await this.createEnrollmentUseCase.execute(
            request.body,
        );
        // 201 Created — nuevo recurso creado exitosamente
        return reply.status(201).send({ data: enrollment });
    }

    // PATCH /api/v1/enrollments/:id
    // Recibe el id en la URL y el body con is_active opcional
    async update(
        request: FastifyRequest<{
            Params: { id: string };
            Body: UpdateEnrollmentRequest;
        }>,
        reply: FastifyReply,
    ) {
        const enrollment = await this.updateEnrollmentUseCase.execute(
            request.params.id,
            request.body,
        );
        return reply.status(200).send({ data: enrollment });
    }

    // DELETE /api/v1/enrollments/:id
    // Solo recibe el id en la URL — no hay body
    // Devuelve 200 con el DTO actualizado (soft delete, el recurso sigue existiendo)
    async delete(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
    ) {
        const enrollment = await this.deleteEnrollmentUseCase.execute(
            request.params.id,
        );
        // 200 OK con el DTO — porque el recurso sigue existiendo con deleted_at poblado
        return reply.status(200).send({ data: enrollment });
    }
}
