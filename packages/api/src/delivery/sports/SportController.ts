import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateSportUseCase } from '../../application/sports/CreateSportUseCase.js';
import { GetSportsUseCase } from '../../application/sports/GetSportsUseCase.js';
import { UpdateSportUseCase } from '../../application/sports/UpdateSportUseCase.js';
import { DeleteSportUseCase } from '../../application/sports/DeleteSportUseCase.js';
import { CreateSportRequest, UpdateSportRequest } from '@alentapp/shared';

export class SportController {
    constructor(
        private readonly createSportUseCase: CreateSportUseCase,
        private readonly getSportsUseCase: GetSportsUseCase,
        private readonly updateSportUseCase: UpdateSportUseCase,
        private readonly deleteSportUseCase: DeleteSportUseCase,
    ) {}

    async getAll(_request: FastifyRequest, reply: FastifyReply) {
        const sports = await this.getSportsUseCase.execute();
        return reply.status(200).send({ data: sports });
    }

    async create(
        request: FastifyRequest<{ Body: CreateSportRequest }>,
        reply: FastifyReply,
    ) {
        const sport = await this.createSportUseCase.execute(request.body);
        return reply.status(201).send({ data: sport });
    }

    async update(
        request: FastifyRequest<{
            Params: { id: string };
            Body: UpdateSportRequest;
        }>,
        reply: FastifyReply,
    ) {
        const sport = await this.updateSportUseCase.execute(
            request.params.id,
            request.body,
        );
        return reply.status(200).send({ data: sport });
    }

    async delete(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
    ) {
        const sport = await this.deleteSportUseCase.execute(request.params.id);
        return reply.status(200).send({ data: sport });
    }
}
