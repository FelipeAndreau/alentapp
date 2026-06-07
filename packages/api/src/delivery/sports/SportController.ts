import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateSportUseCase } from '../../application/sports/CreateSportUseCase.js';
import { GetSportsUseCase } from '../../application/sports/GetSportsUseCase.js';
import { UpdateSportUseCase } from '../../application/sports/UpdateSportUseCase.js';
import { DeleteSportUseCase } from '../../application/sports/DeleteSportUseCase.js';
import { CreateSportRequest, UpdateSportRequest } from '@alentapp/shared';
import {
    NotFoundError,
    ValidationError,
    ConflictError,
} from '../../domain/payments/errors/PaymentErrors.js';
import { SportAlreadyDeletedError } from '../../domain/sports/errors/SportErrors.js';
import {
    requestCounter,
    errorCounter,
    requestDuration,
    incrementActiveRequests,
    decrementActiveRequests,
} from '../../infrastructure/telemetry.js';

export class SportController {
    constructor(
        private readonly createSportUseCase: CreateSportUseCase,
        private readonly getSportsUseCase: GetSportsUseCase,
        private readonly updateSportUseCase: UpdateSportUseCase,
        private readonly deleteSportUseCase: DeleteSportUseCase,
    ) {}

    async getAll(request: FastifyRequest, reply: FastifyReply) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];
        incrementActiveRequests();

        try {
            const sports = await this.getSportsUseCase.execute();
            requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: sports });
        } catch (error) {
            errorCounter.add(1, { method, route, status: '500' });
            request.log.error({ err: error }, 'Failed to get sports');
            return reply.status(500).send({ error: 'Internal server error' });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
            decrementActiveRequests();
        }
    }

    async create(
        request: FastifyRequest<{ Body: CreateSportRequest }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];
        incrementActiveRequests();

        try {
            const sport = await this.createSportUseCase.execute(request.body);
            requestCounter.add(1, { method, route, status: '201' });
            return reply.status(201).send({ data: sport });
        } catch (error) {
            if (error instanceof ConflictError) {
                errorCounter.add(1, { method, route, status: '409' });
                return reply
                    .status(409)
                    .send({
                        error: (error as any).message,
                        code: (error as any).code,
                    });
            }
            if (error instanceof ValidationError) {
                errorCounter.add(1, { method, route, status: '400' });
                return reply
                    .status(400)
                    .send({
                        error: (error as any).message,
                        code: (error as any).code,
                    });
            }
            errorCounter.add(1, { method, route, status: '500' });
            request.log.error({ err: error }, 'Failed to create sport');
            return reply.status(500).send({ error: 'Internal server error' });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
            decrementActiveRequests();
        }
    }

    async update(
        request: FastifyRequest<{
            Params: { id: string };
            Body: UpdateSportRequest;
        }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];
        incrementActiveRequests();

        try {
            const sport = await this.updateSportUseCase.execute(
                request.params.id,
                request.body,
            );
            requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: sport });
        } catch (error) {
            if (error instanceof NotFoundError) {
                errorCounter.add(1, { method, route, status: '404' });
                return reply
                    .status(404)
                    .send({
                        error: (error as any).message,
                        code: (error as any).code,
                    });
            }
            if (error instanceof ValidationError) {
                errorCounter.add(1, { method, route, status: '400' });
                return reply
                    .status(400)
                    .send({
                        error: (error as any).message,
                        code: (error as any).code,
                    });
            }
            errorCounter.add(1, { method, route, status: '500' });
            request.log.error({ err: error }, 'Failed to update sport');
            return reply.status(500).send({ error: 'Internal server error' });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
            decrementActiveRequests();
        }
    }

    async delete(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];
        incrementActiveRequests();

        try {
            const sport = await this.deleteSportUseCase.execute(
                request.params.id,
            );
            requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: sport });
        } catch (error) {
            if (error instanceof NotFoundError) {
                errorCounter.add(1, { method, route, status: '404' });
                return reply
                    .status(404)
                    .send({
                        error: (error as any).message,
                        code: (error as any).code,
                    });
            }
            if (error instanceof ConflictError || error instanceof SportAlreadyDeletedError) {
                errorCounter.add(1, { method, route, status: '409' });
                return reply
                    .status(409)
                    .send({
                        error: (error as any).message,
                        code: (error as any).code,
                    });
            }
            errorCounter.add(1, { method, route, status: '500' });
            request.log.error({ err: error }, 'Failed to delete sport');
            return reply.status(500).send({ error: 'Internal server error' });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
            decrementActiveRequests();
        }
    }
}
