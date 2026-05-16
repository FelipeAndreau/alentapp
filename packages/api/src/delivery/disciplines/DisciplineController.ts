import { FastifyRequest, FastifyReply } from 'fastify';
<<<<<<< HEAD:packages/api/src/delivery/disciplines/DisciplineController.ts
import { CreateDisciplineUseCase } from '../../application/disciplines/CreateDisciplineUseCase.js';
import { GetDisciplinesUseCase } from '../../application/disciplines/GetDisciplinesUseCase.js';
import { CreateDisciplineRequest } from '@alentapp/shared';
=======
import { CreateDisciplineUseCase } from '../application/disciplines/CreateDisciplineUseCase.js';
import { GetDisciplinesUseCase } from '../application/disciplines/GetDisciplinesUseCase.js';
import { UpdateDisciplineUseCase } from '../application/disciplines/UpdateDisciplineUseCase.js';
import { DeleteDisciplineUseCase } from '../application/disciplines/DeleteDisciplineUseCase.js';
import { CreateDisciplineRequest, UpdateDisciplineRequest } from '@alentapp/shared';
>>>>>>> origin/feature/discipline-delete:packages/api/src/delivery/DisciplineController.ts

export class DisciplineController {
    constructor(
        private readonly createDisciplineUseCase: CreateDisciplineUseCase,
        private readonly getDisciplinesUseCase: GetDisciplinesUseCase,
        private readonly updateDisciplineUseCase: UpdateDisciplineUseCase,
        private readonly deleteDisciplineUseCase: DeleteDisciplineUseCase,
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
<<<<<<< HEAD:packages/api/src/delivery/disciplines/DisciplineController.ts
=======

    async create(request: FastifyRequest<{ Body: CreateDisciplineRequest }>, reply: FastifyReply) {
        const discipline = await this.createDisciplineUseCase.execute(request.body);
        return reply.status(201).send({ data: discipline });
    }

    async update(request: FastifyRequest<{ Params: { id: string }; Body: UpdateDisciplineRequest }>, reply: FastifyReply) {
        const discipline = await this.updateDisciplineUseCase.execute(request.params.id, request.body);
        return reply.status(200).send({ data: discipline });
    }

    async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        await this.deleteDisciplineUseCase.execute(request.params.id);
        return reply.status(204).send();
    }
>>>>>>> origin/feature/discipline-delete:packages/api/src/delivery/DisciplineController.ts
}
