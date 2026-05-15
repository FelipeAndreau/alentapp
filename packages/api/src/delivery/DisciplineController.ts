import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateDisciplineUseCase } from '../application/disciplines/CreateDisciplineUseCase.js';
import { GetDisciplinesUseCase } from '../application/disciplines/GetDisciplinesUseCase.js';
import { CreateDisciplineRequest } from '@alentapp/shared';
import { NotFoundError, ValidationError } from '../domain/errors/PaymentErrors.js';

export class DisciplineController {
    constructor(
        private readonly createDisciplineUseCase: CreateDisciplineUseCase,
        private readonly getDisciplinesUseCase: GetDisciplinesUseCase,
    ) {}

    async getAll(request: FastifyRequest, reply: FastifyReply) {
        try {
            const disciplines = await this.getDisciplinesUseCase.execute();
            return reply.status(200).send({ data: disciplines });
        } catch (error) {
            request.log.error({ err: error }, 'Failed to get disciplines');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    }

    async create(request: FastifyRequest<{ Body: CreateDisciplineRequest }>, reply: FastifyReply) {
        try {
            const discipline = await this.createDisciplineUseCase.execute(request.body);
            return reply.status(201).send({ data: discipline });
        } catch (error) {
            if (error instanceof NotFoundError) return reply.status(404).send({ error: (error as Error).message, code: (error as any).code });
            if (error instanceof ValidationError) return reply.status(400).send({ error: (error as Error).message, code: (error as any).code });

            request.log.error({ err: error }, 'Failed to create discipline');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    }
}
