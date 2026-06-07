import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateEnrollmentUseCase } from '../../application/enrollments/CreateEnrollmentUseCase.js';
import { GetEnrollmentsUseCase } from '../../application/enrollments/GetEnrollmentsUseCase.js';
import { UpdateEnrollmentUseCase } from '../../application/enrollments/UpdateEnrollmentUseCase.js';
import { DeleteEnrollmentUseCase } from '../../application/enrollments/DeleteEnrollmentUseCase.js';
import {
    CreateEnrollmentRequest,
    UpdateEnrollmentRequest,
} from '@alentapp/shared';
import {
    requestCounter,
    errorCounter,
    requestDuration,
    incrementActiveRequests,
    decrementActiveRequests,
} from '../../infrastructure/telemetry.js';

export class EnrollmentController {
    constructor(
        private readonly createEnrollmentUseCase: CreateEnrollmentUseCase,
        private readonly getEnrollmentsUseCase: GetEnrollmentsUseCase,
        private readonly updateEnrollmentUseCase: UpdateEnrollmentUseCase,
        private readonly deleteEnrollmentUseCase: DeleteEnrollmentUseCase,
    ) {}

    async getAll(request: FastifyRequest, reply: FastifyReply) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];
        incrementActiveRequests();
        try {
            const enrollments = await this.getEnrollmentsUseCase.execute();
            requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: enrollments });
        } catch (error: any) {
            errorCounter.add(1, { method, route, status: '500' });
            throw error;
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
            decrementActiveRequests();
        }
    }

    async create(
        request: FastifyRequest<{ Body: CreateEnrollmentRequest }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];
        incrementActiveRequests();
        try {
            const enrollment = await this.createEnrollmentUseCase.execute(
                request.body,
            );
            requestCounter.add(1, { method, route, status: '201' });
            return reply.status(201).send({ data: enrollment });
        } catch (error: any) {
            errorCounter.add(1, { method, route, status: '400' });
            throw error;
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
            decrementActiveRequests();
        }
    }

    async update(
        request: FastifyRequest<{
            Params: { id: string };
            Body: UpdateEnrollmentRequest;
        }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];
        incrementActiveRequests();
        try {
            const enrollment = await this.updateEnrollmentUseCase.execute(
                request.params.id,
                request.body,
            );
            requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: enrollment });
        } catch (error: any) {
            errorCounter.add(1, { method, route, status: '400' });
            throw error;
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
            const enrollment = await this.deleteEnrollmentUseCase.execute(
                request.params.id,
            );
            requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: enrollment });
        } catch (error: any) {
            errorCounter.add(1, { method, route, status: '400' });
            throw error;
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
            decrementActiveRequests();
        }
    }
}
