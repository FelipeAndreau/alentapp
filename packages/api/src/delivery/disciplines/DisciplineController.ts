import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateDisciplineUseCase } from '../../application/disciplines/CreateDisciplineUseCase.js';
import { CreateDisciplineRequest } from '@alentapp/shared';

export class DisciplineController {
    constructor(
        private readonly createDisciplineUseCase: CreateDisciplineUseCase,
    ) {}

    async create(
        request: FastifyRequest<{ Body: CreateDisciplineRequest }>,
        reply: FastifyReply,
    ) {
        try {
            const discipline = await this.createDisciplineUseCase.execute(request.body);
            return reply.status(201).send({ data: discipline });
        } catch (error: any) {
            if (error.message.includes('No existe un socio con ese ID')) {
                return reply.status(404).send({ error: error.message });
            }
            if (error.message.includes('posterior a la de inicio')) {
                return reply.status(400).send({ error: error.message });
            }
            return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
        }
    }
}
