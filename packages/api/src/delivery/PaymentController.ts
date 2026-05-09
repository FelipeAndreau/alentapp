import { FastifyRequest, FastifyReply } from 'fastify';
import { CreatePaymentUseCase } from '../application/payments/CreatePaymentUseCase.js';
import { UpdatePaymentUseCase } from '../application/payments/UpdatePaymentUseCase.js';
import { MarkPaymentAsPaidUseCase } from '../application/payments/MarkPaymentAsPaidUseCase.js';
import { CancelPaymentUseCase } from '../application/payments/CancelPaymentUseCase.js';
import { CreatePaymentRequest, PaymentDTO } from '@alentapp/shared';

export class PaymentController {
    constructor(
        private readonly createPaymentUseCase: CreatePaymentUseCase,
        private readonly updatePaymentUseCase: UpdatePaymentUseCase,
        private readonly markPaymentAsPaidUseCase: MarkPaymentAsPaidUseCase,
        private readonly cancelPaymentUseCase: CancelPaymentUseCase
    ) {}

    async create(request: FastifyRequest<{ Body: CreatePaymentRequest }>, reply: FastifyReply) {
        try {
            const payment = await this.createPaymentUseCase.execute(request.body);
            return reply.status(201).send({ data: payment });
        } catch (error: any) {
            const msg = error.message;
            if (msg.includes('Socio no encontrado')) return reply.status(404).send({ error: msg });
            if (msg.includes('Ya existe un pago activo')) return reply.status(409).send({ error: msg });
            return reply.status(400).send({ error: msg });
        }
    }

    async update(request: FastifyRequest<{ Params: { id: string }; Body: Partial<PaymentDTO> }>, reply: FastifyReply) {
        try {
            const payment = await this.updatePaymentUseCase.execute(request.params.id, request.body);
            return reply.status(200).send({ data: payment });
        } catch (error: any) {
            const msg = error.message;
            if (msg.includes('no encontrado')) return reply.status(404).send({ error: msg });
            return reply.status(400).send({ error: msg });
        }
    }

    async pay(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        try {
            const payment = await this.markPaymentAsPaidUseCase.execute(request.params.id);
            return reply.status(200).send({ data: payment });
        } catch (error: any) {
            const msg = error.message;
            if (msg.includes('no encontrado')) return reply.status(404).send({ error: msg });
            if (msg.includes('anulado')) return reply.status(409).send({ error: msg });
            return reply.status(400).send({ error: msg });
        }
    }

    async cancel(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        try {
            const payment = await this.cancelPaymentUseCase.execute(request.params.id);
            return reply.status(200).send({ data: payment });
        } catch (error: any) {
            const msg = error.message;
            if (msg.includes('no encontrado')) return reply.status(404).send({ error: msg });
            if (msg.includes('cobrado')) return reply.status(409).send({ error: msg });
            return reply.status(400).send({ error: msg });
        }
    }

    // Manejador explícito para cumplir con la política de inmutabilidad (Defense in Depth)
    async deleteBlocker(_request: FastifyRequest, reply: FastifyReply) {
        return reply.status(405).send({
            error: "Method Not Allowed",
            message: "La eliminación física de pagos está prohibida por política de auditoría. Use el endpoint PATCH /payments/:id/cancel para anular.",
            code: "IMMUTABILITY_POLICY"
        });
    }
}
