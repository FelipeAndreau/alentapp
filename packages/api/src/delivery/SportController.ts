import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateSportUseCase } from '../application/sports/CreateSportUseCase.js';
import { GetSportsUseCase } from '../application/sports/GetSportsUseCase.js';
import { UpdateSportUseCase } from '../application/sports/UpdateSportUseCase.js';
import { DeleteSportUseCase } from '../application/sports/DeleteSportUseCase.js';
import { CreateSportRequest, UpdateSportRequest } from '@alentapp/shared';
import {
    NotFoundError,
    ConflictError,
    ValidationError,
} from '../domain/errors/PaymentErrors.js';

export class SportController {
    constructor(
        private readonly createSportUseCase: CreateSportUseCase,
        private readonly getSportsUseCase: GetSportsUseCase,
        private readonly updateSportUseCase: UpdateSportUseCase,
        private readonly deleteSportUseCase: DeleteSportUseCase,
    ) {}

    async getAll(request: FastifyRequest, reply: FastifyReply) {
        try {
            const sports = await this.getSportsUseCase.execute();
            return reply.status(200).send({ data: sports });
        } catch (error) {
            request.log.error({ err: error }, 'Failed to get sports');
            return reply
                .status(500)
                .send({ error: 'Error interno, reintente más tarde' });
        }
    }

    async create(
        request: FastifyRequest<{ Body: CreateSportRequest }>,
        reply: FastifyReply,
    ) {
        try {
            const sport = await this.createSportUseCase.execute(request.body);
            return reply.status(201).send({ data: sport });
        } catch (error) {
            if (error instanceof NotFoundError)
                return reply
                    .status(404)
                    .send({ error: error.message, code: error.code });
            if (error instanceof ConflictError)
                return reply
                    .status(409)
                    .send({ error: error.message, code: error.code });
            if (error instanceof ValidationError)
                return reply
                    .status(400)
                    .send({ error: error.message, code: error.code });

            request.log.error({ err: error }, 'Failed to create sport');
            return reply
                .status(500)
                .send({ error: 'Error interno, reintente más tarde' });
        }
    }

    async update(
        request: FastifyRequest<{
            Params: { id: string };
            Body: UpdateSportRequest;
        }>,
        reply: FastifyReply,
    ) {
        try {
            const sport = await this.updateSportUseCase.execute(
                request.params.id,
                request.body,
            );
            return reply.status(200).send({ data: sport });
        } catch (error) {
            if (error instanceof NotFoundError)
                return reply
                    .status(404)
                    .send({ error: error.message, code: error.code });
            if (error instanceof ConflictError)
                return reply
                    .status(409)
                    .send({ error: error.message, code: error.code });
            if (error instanceof ValidationError)
                return reply
                    .status(400)
                    .send({ error: error.message, code: error.code });

            request.log.error({ err: error }, 'Failed to update sport');
            return reply
                .status(500)
                .send({ error: 'Error interno, reintente más tarde' });
        }
    }

    async delete(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
    ) {
        try {
            const sport = await this.deleteSportUseCase.execute(
                request.params.id,
            );
            return reply.status(200).send({ data: sport });
        } catch (error) {
            if (error instanceof NotFoundError)
                return reply
                    .status(404)
                    .send({ error: error.message, code: error.code });
            if (error instanceof ConflictError)
                return reply
                    .status(409)
                    .send({ error: error.message, code: error.code });
            if (error instanceof ValidationError)
                return reply
                    .status(400)
                    .send({ error: error.message, code: error.code });

            request.log.error({ err: error }, 'Failed to delete sport');
            return reply
                .status(500)
                .send({ error: 'Error interno, reintente más tarde' });
        }
    }
}
