import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PostgresMemberRepository } from './infrastructure/PostgresMemberRepository.js';
import { MemberValidator } from './domain/services/MemberValidator.js';
import { CreateMemberUseCase } from './application/NewMemberUseCase.js';
import { GetMembersUseCase } from './application/GetMembersUseCase.js';
import { UpdateMemberUseCase } from './application/UpdateMemberUseCase.js';
import { DeleteMemberUseCase } from './application/DeleteMemberUseCase.js';
import { MemberController } from './delivery/MemberController.js';
import { PostgresDisciplineRepository } from './infrastructure/PostgresDisciplineRepository.js';
import { CreateDisciplineUseCase } from './application/disciplines/CreateDisciplineUseCase.js';
import { GetDisciplinesUseCase } from './application/disciplines/GetDisciplinesUseCase.js';
import { DisciplineController } from './delivery/DisciplineController.js';
import { PostgresPaymentRepository } from './infrastructure/PostgresPaymentRepository.js';
import { SystemClock } from './domain/services/Clock.js';
import { CreatePaymentUseCase } from './application/payments/CreatePaymentUseCase.js';
import { UpdatePaymentUseCase } from './application/payments/UpdatePaymentUseCase.js';
import { MarkPaymentAsPaidUseCase } from './application/payments/MarkPaymentAsPaidUseCase.js';
import { CancelPaymentUseCase } from './application/payments/CancelPaymentUseCase.js';
import { GetPaymentsUseCase } from './application/payments/GetPaymentsUseCase.js';
import { PaymentController } from './delivery/PaymentController.js';
import { NotFoundError, ValidationError, ConflictError } from './domain/errors/PaymentErrors.js';

export function buildApp() {
    const server = Fastify({
        logger: {
            level: 'info',
            transport: process.env.NODE_ENV === 'development'
            ? {
                target: 'pino-pretty',
                options: { translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' },
                }
            : undefined,
        },
    });

    server.register(cors, {
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    });

    server.setErrorHandler((error, request, reply) => {
        if (error instanceof NotFoundError) {
            return reply.status(404).send({ error: error.message, code: (error as any).code });
        }
        if (error instanceof ValidationError) {
            return reply.status(400).send({ error: error.message, code: (error as any).code });
        }
        if (error instanceof ConflictError) {
            return reply.status(409).send({ error: error.message, code: (error as any).code });
        }
        request.log.error({ err: error }, 'Unhandled error');
        return reply.status(500).send({ error: 'Internal server error' });
    });

    const memberRepo = new PostgresMemberRepository();
    const memberValidator = new MemberValidator(memberRepo);

    const createMemberUseCase = new CreateMemberUseCase(memberRepo, memberValidator);
    const getMembersUseCase = new GetMembersUseCase(memberRepo);
    const updateMemberUseCase = new UpdateMemberUseCase(memberRepo, memberValidator);
    const deleteMemberUseCase = new DeleteMemberUseCase(memberRepo);

    const memberController = new MemberController(
        createMemberUseCase,
        getMembersUseCase,
        updateMemberUseCase,
        deleteMemberUseCase
    );

    server.get('/api/v1/socios', memberController.getAll.bind(memberController));
    server.post('/api/v1/socios', memberController.create.bind(memberController));
    server.put('/api/v1/socios/:id', memberController.update.bind(memberController));
    server.delete('/api/v1/socios/:id', memberController.delete.bind(memberController));

    const disciplineRepo = new PostgresDisciplineRepository();
    const createDisciplineUseCase = new CreateDisciplineUseCase(disciplineRepo, memberRepo);
    const getDisciplinesUseCase = new GetDisciplinesUseCase(disciplineRepo);
    const disciplineController = new DisciplineController(createDisciplineUseCase, getDisciplinesUseCase);

    server.get('/api/v1/disciplines', disciplineController.getAll.bind(disciplineController));
    server.post('/api/v1/disciplines', disciplineController.create.bind(disciplineController));

    const paymentRepo = new PostgresPaymentRepository();
    const systemClock = new SystemClock();

    const createPaymentUseCase = new CreatePaymentUseCase(paymentRepo, memberRepo);
    const updatePaymentUseCase = new UpdatePaymentUseCase(paymentRepo);
    const markPaymentAsPaidUseCase = new MarkPaymentAsPaidUseCase(paymentRepo, systemClock);
    const cancelPaymentUseCase = new CancelPaymentUseCase(paymentRepo);
    const getPaymentsUseCase = new GetPaymentsUseCase(paymentRepo);

    const paymentController = new PaymentController(
        createPaymentUseCase,
        updatePaymentUseCase,
        markPaymentAsPaidUseCase,
        cancelPaymentUseCase,
        getPaymentsUseCase
    );

    server.get('/api/v1/payments', paymentController.getAll.bind(paymentController));
    server.post('/api/v1/payments', paymentController.create.bind(paymentController));
    server.patch('/api/v1/payments/:id', paymentController.update.bind(paymentController));
    server.patch('/api/v1/payments/:id/pay', paymentController.pay.bind(paymentController));
    server.patch('/api/v1/payments/:id/cancel', paymentController.cancel.bind(paymentController));
    server.delete('/api/v1/payments/:id', paymentController.deleteBlocker.bind(paymentController));

    server.get('/', async (req, rep) => {
        rep.status(200).send({ msg: 'asd' })
    });

    return server;
}

// Solo iniciar el servidor si el script se ejecuta directamente (no cuando es importado por vitest)
if (process.argv[1] && process.argv[1].endsWith('app.ts')) {
    const server = buildApp();
    const port = parseInt(process.env.PORT || '3000', 10);

    server.listen({ port, host: '0.0.0.0' }, () =>
        server.log.info(`API server running on http://localhost:${port}`)
    );

    ['SIGINT', 'SIGTERM'].forEach((signal) => {
        process.on(signal, async () => {
            await server.close();
            process.exit(0);
        });
    });
}
