import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateDisciplineUseCase } from '../../application/disciplines/CreateDisciplineUseCase.js';
import { GetDisciplinesUseCase } from '../../application/disciplines/GetDisciplinesUseCase.js';
import { CreateDisciplineRequest } from '@alentapp/shared';

export class DisciplineController {
    constructor(
        private readonly createDisciplineUseCase: CreateDisciplineUseCase,
        private readonly getDisciplinesUseCase: GetDisciplinesUseCase,
    ) {}

    async create(
        request: FastifyRequest<{ Body: CreateDisciplineRequest }>,
        reply: FastifyReply,
    ) {
        const discipline = await this.createDisciplineUseCase.execute(request.body);
        return reply.status(201).send({ data: discipline });
    }

    async getAll(_request: FastifyRequest, reply: FastifyReply) {
        const disciplines = await this.getDisciplinesUseCase.execute();
        return reply.status(200).send({ data: disciplines });
    }
}
