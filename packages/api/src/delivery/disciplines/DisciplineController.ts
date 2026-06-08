import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateDisciplineUseCase } from '../../application/disciplines/CreateDisciplineUseCase.js';
import { GetDisciplinesUseCase } from '../../application/disciplines/GetDisciplinesUseCase.js';
import { UpdateDisciplineUseCase } from '../../application/disciplines/UpdateDisciplineUseCase.js';
import { DeleteDisciplineUseCase } from '../../application/disciplines/DeleteDisciplineUseCase.js';
import { CreateDisciplineRequest, UpdateDisciplineRequest } from '@alentapp/shared';
import {
    NotFoundError,
    ValidationError,
} from '../../domain/payments/errors/PaymentErrors.js';
import {
    requestCounter,
    errorCounter,
    requestDuration,
    incrementActiveRequests,
    decrementActiveRequests,
} from '../../infrastructure/telemetry.js';

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
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];
        incrementActiveRequests();

        try {
            const discipline = await this.createDisciplineUseCase.execute(request.body);
            requestCounter.add(1, { method, route, status: '201' });
            return reply.status(201).send({ data: discipline });
        } catch (error) {
            if (error instanceof NotFoundError) {
                errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: error.message, code: (error as any).code });
            }
            if (error instanceof ValidationError) {
                errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message, code: (error as any).code });
            }
            errorCounter.add(1, { method, route, status: '500' });
            request.log.error({ err: error }, 'Failed to create discipline');
            return reply.status(500).send({ error: 'Internal server error' });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
            decrementActiveRequests();
        }
    }

    async getAll(request: FastifyRequest, reply: FastifyReply) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];
        incrementActiveRequests();

        try {
            const disciplines = await this.getDisciplinesUseCase.execute();
            requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: disciplines });
        } catch (error) {
            errorCounter.add(1, { method, route, status: '500' });
            request.log.error({ err: error }, 'Failed to get disciplines');
            return reply.status(500).send({ error: 'Internal server error' });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
            decrementActiveRequests();
        }
    }

    async update(
        request: FastifyRequest<{ Params: { id: string }; Body: UpdateDisciplineRequest }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];
        incrementActiveRequests();

        try {
            const discipline = await this.updateDisciplineUseCase.execute(request.params.id, request.body);
            requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: discipline });
        } catch (error) {
            if (error instanceof NotFoundError) {
                errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: error.message, code: (error as any).code });
            }
            if (error instanceof ValidationError) {
                errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message, code: (error as any).code });
            }
            errorCounter.add(1, { method, route, status: '500' });
            request.log.error({ err: error }, 'Failed to update discipline');
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
            await this.deleteDisciplineUseCase.execute(request.params.id);
            requestCounter.add(1, { method, route, status: '204' });
            return reply.status(204).send();
        } catch (error) {
            if (error instanceof NotFoundError) {
                errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: error.message, code: (error as any).code });
            }
            errorCounter.add(1, { method, route, status: '500' });
            request.log.error({ err: error }, 'Failed to delete discipline');
            return reply.status(500).send({ error: 'Internal server error' });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
            decrementActiveRequests();
        }
    }
}
