import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateDisciplineUseCase } from '../application/disciplines/CreateDisciplineUseCase.js';
import { GetDisciplinesUseCase } from '../application/disciplines/GetDisciplinesUseCase.js';
import { UpdateDisciplineUseCase } from '../application/disciplines/UpdateDisciplineUseCase.js';
import { CreateDisciplineRequest, UpdateDisciplineRequest } from '@alentapp/shared';

export class DisciplineController {
    constructor(
        private readonly createDisciplineUseCase: CreateDisciplineUseCase,
        private readonly getDisciplinesUseCase: GetDisciplinesUseCase,
        private readonly updateDisciplineUseCase: UpdateDisciplineUseCase,
    ) {}

    async getAll(_request: FastifyRequest, reply: FastifyReply) {
        const disciplines = await this.getDisciplinesUseCase.execute();
        return reply.status(200).send({ data: disciplines });
    }

    async create(request: FastifyRequest<{ Body: CreateDisciplineRequest }>, reply: FastifyReply) {
        const discipline = await this.createDisciplineUseCase.execute(request.body);
        return reply.status(201).send({ data: discipline });
    }

    async update(request: FastifyRequest<{ Params: { id: string }; Body: UpdateDisciplineRequest }>, reply: FastifyReply) {
        const discipline = await this.updateDisciplineUseCase.execute(request.params.id, request.body);
        return reply.status(200).send({ data: discipline });
    }
}
