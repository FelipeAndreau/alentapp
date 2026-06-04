import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateLockerUseCase } from '../../application/lockers/CreateLockerUseCase.js';
import { GetLockersUseCase } from '../../application/lockers/GetLockersUseCase.js';
import { UpdateLockerUseCase } from '../../application/lockers/UpdateLockerUseCase.js';
import { DeleteLockerUseCase } from '../../application/lockers/DeleteLockerUseCase.js';
import { CreateLockerRequest, UpdateLockerRequest } from '@alentapp/shared';
import {
    requestCounter,
    errorCounter,
    requestDuration,
    incrementActiveRequests,
    decrementActiveRequests,
} from '../../infrastructure/telemetry.js';

export class LockerController {
    constructor(
        private readonly createLockerUseCase: CreateLockerUseCase,
        private readonly getLockersUseCase: GetLockersUseCase,
        private readonly updateLockerUseCase: UpdateLockerUseCase,
        private readonly deleteLockerUseCase: DeleteLockerUseCase,
    ) { }

    async getAll(_request: FastifyRequest, reply: FastifyReply) {
        const start = Date.now();
        const method = _request.method;
        const route = _request.url.split('?')[0];
        incrementActiveRequests();

        try {
            const lockers = await this.getLockersUseCase.execute();
            requestCounter.add(1, { method, route, status: '200' });
            return reply.status(200).send({ data: lockers });
        } catch (error: any) {
            errorCounter.add(1, { method, route, status: '500' });
            _request.log.error({ err: error }, 'Failed to get lockers');
            return reply.status(500).send({ error: error.message });
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
            decrementActiveRequests();
        }
    }

    async create(
        request: FastifyRequest<{ Body: CreateLockerRequest }>,
        reply: FastifyReply,
    ) {
        try {
            const locker = await this.createLockerUseCase.execute(request.body);
            return reply.status(201).send({ data: locker });
        } catch (error: any) {
            if (error.message.includes('Ya existe un casillero con ese número')) {
                return reply.status(409).send({ error: error.message });
            }
            if (error.message.includes('mayor a 0') || error.message.includes('no puede estar vacío')) {
                return reply.status(400).send({ error: error.message });
            }
            return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
        }
    }

    async update(
        request: FastifyRequest<{ Params: { id: string }; Body: UpdateLockerRequest }>,
        reply: FastifyReply,
    ) {
        try {
            const { id } = request.params;
            const locker = await this.updateLockerUseCase.execute(id, request.body);
            return reply.status(200).send({ data: locker });
        } catch (error: any) {
            if (error.message.includes('No existe un casillero con ese ID')) {
                return reply.status(404).send({ error: error.message });
            }
            if (error.message.includes('No existe un socio con ese ID')) {
                return reply.status(404).send({ error: error.message });
            }
            if (error.message.includes('no está disponible')) {
                return reply.status(409).send({ error: error.message });
            }
            if (error.message.includes('member_id') || error.message.includes('Occupied')) {
                return reply.status(400).send({ error: error.message });
            }
            return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
        }
    }

    async delete(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
    ) {
        try {
            const { id } = request.params;
            await this.deleteLockerUseCase.execute(id);
            return reply.status(200).send({ message: 'Casillero eliminado correctamente' });
        } catch (error: any) {
            if (error.message.includes('No existe un casillero con ese ID')) {
                return reply.status(404).send({ error: error.message });
            }
            if (error.message.includes('No se puede eliminar')) {
                return reply.status(409).send({ error: error.message });
            }
            return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
        }
    }
}