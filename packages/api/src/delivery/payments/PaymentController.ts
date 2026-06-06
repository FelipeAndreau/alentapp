import { FastifyRequest, FastifyReply } from 'fastify';
import { CreatePaymentUseCase } from '../../application/payments/CreatePaymentUseCase.js';
import { UpdatePaymentUseCase } from '../../application/payments/UpdatePaymentUseCase.js';
import { MarkPaymentAsPaidUseCase } from '../../application/payments/MarkPaymentAsPaidUseCase.js';
import { CancelPaymentUseCase } from '../../application/payments/CancelPaymentUseCase.js';
import { GetPaymentsUseCase } from '../../application/payments/GetPaymentsUseCase.js';
import { CreatePaymentRequest, PaymentDTO } from '@alentapp/shared';
import { 
    NotFoundError, 
    ConflictError, 
    ValidationError,
    DomainError
} from '../../domain/payments/errors/PaymentErrors.js';
import {
    requestCounter,
    errorCounter,
    requestDuration,
    incrementActiveRequests,
    decrementActiveRequests,
} from '../../infrastructure/telemetry.js';

export class PaymentController {
    constructor(
        private readonly createPaymentUseCase: CreatePaymentUseCase,
        private readonly updatePaymentUseCase: UpdatePaymentUseCase,
        private readonly markPaymentAsPaidUseCase: MarkPaymentAsPaidUseCase,
        private readonly cancelPaymentUseCase: CancelPaymentUseCase,
        private readonly getPaymentsUseCase: GetPaymentsUseCase
    ) {}

    async getAll(request: FastifyRequest, reply: FastifyReply) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];
        incrementActiveRequests();

        try {
            const payments = await this.getPaymentsUseCase.execute();
            requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: payments });
        } catch (error) {
            errorCounter.add(1, { method, route, status: '500' });
            request.log.error({ err: error }, 'Failed to get payments');
            return reply.status(500).send({ error: "Internal server error" });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
            decrementActiveRequests();
        }
    }

    async create(request: FastifyRequest<{ Body: CreatePaymentRequest }>, reply: FastifyReply) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];
        incrementActiveRequests();

        try {
            const payment = await this.createPaymentUseCase.execute(request.body);
            requestCounter.add(1, { method, route, status: '201' });
            return reply.status(201).send({ data: payment });
        } catch (error) {
            if (error instanceof NotFoundError) {
                errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: error.message, code: error.code });
            }
            if (error instanceof ConflictError) {
                errorCounter.add(1, { method, route, status: '409' });
                return reply.status(409).send({ error: error.message, code: error.code });
            }
            if (error instanceof ValidationError) {
                errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message, code: error.code });
            }
            errorCounter.add(1, { method, route, status: '500' });
            request.log.error({ err: error }, 'Failed to create payment');
            return reply.status(500).send({ error: "Internal server error" });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
            decrementActiveRequests();
        }
    }

    async update(request: FastifyRequest<{ Params: { id: string }; Body: Partial<PaymentDTO> }>, reply: FastifyReply) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];
        incrementActiveRequests();

        try {
            const payment = await this.updatePaymentUseCase.execute(request.params.id, request.body);
            requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: payment });
        } catch (error) {
            if (error instanceof NotFoundError) {
                errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: error.message, code: error.code });
            }
            if (error instanceof ConflictError) {
                errorCounter.add(1, { method, route, status: '409' });
                return reply.status(409).send({ error: error.message, code: error.code });
            }
            if (error instanceof ValidationError) {
                errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message, code: error.code });
            }
            errorCounter.add(1, { method, route, status: '500' });
            request.log.error({ err: error }, 'Failed to update payment');
            return reply.status(500).send({ error: "Internal server error" });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
            decrementActiveRequests();
        }
    }

    async pay(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];
        incrementActiveRequests();

        try {
            const payment = await this.markPaymentAsPaidUseCase.execute(request.params.id);
            requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: payment });
        } catch (error) {
            if (error instanceof NotFoundError) {
                errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: error.message, code: error.code });
            }
            if (error instanceof ConflictError) {
                errorCounter.add(1, { method, route, status: '409' });
                return reply.status(409).send({ error: error.message, code: error.code });
            }
            if (error instanceof ValidationError) {
                errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message, code: error.code });
            }
            errorCounter.add(1, { method, route, status: '500' });
            request.log.error({ err: error }, 'Failed to process payment');
            return reply.status(500).send({ error: "Internal server error" });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
            decrementActiveRequests();
        }
    }

    async cancel(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];
        incrementActiveRequests();

        try {
            const payment = await this.cancelPaymentUseCase.execute(request.params.id);
            requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: payment });
        } catch (error) {
            if (error instanceof NotFoundError) {
                errorCounter.add(1, { method, route, status: '404' });
                return reply.status(404).send({ error: error.message, code: error.code });
            }
            if (error instanceof ConflictError) {
                errorCounter.add(1, { method, route, status: '409' });
                return reply.status(409).send({ error: error.message, code: error.code });
            }
            if (error instanceof ValidationError) {
                errorCounter.add(1, { method, route, status: '400' });
                return reply.status(400).send({ error: error.message, code: error.code });
            }
            errorCounter.add(1, { method, route, status: '500' });
            request.log.error({ err: error }, 'Failed to cancel payment');
            return reply.status(500).send({ error: "Internal server error" });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
            decrementActiveRequests();
        }
    }

    async deleteBlocker(request: FastifyRequest, reply: FastifyReply) {
        const start = Date.now();
        const method = request.method;
        const route = request.url.split('?')[0];
        incrementActiveRequests();

        try {
            requestCounter.add(1, { method, route, status: '405' });
            request.log.warn({ msg: "Intento de eliminacion fisica bloqueado", ip: request.ip });
            return reply.status(405).send({
                error: "Method Not Allowed",
                message: "La eliminacion fisica de pagos esta prohibida por politica de auditoria. Use el endpoint PATCH /payments/:id/cancel para anular.",
                code: "IMMUTABILITY_POLICY"
            });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
            decrementActiveRequests();
        }
    }
}
