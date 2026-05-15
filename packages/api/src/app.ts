import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PostgresMemberRepository } from './infrastructure/members/PostgresMemberRepository.js';
import { MemberValidator } from './domain/members/services/MemberValidator.js';
import { CreateMemberUseCase } from './application/members/NewMemberUseCase.js';
import { GetMembersUseCase } from './application/members/GetMembersUseCase.js';
import { UpdateMemberUseCase } from './application/members/UpdateMemberUseCase.js';
import { DeleteMemberUseCase } from './application/members/DeleteMemberUseCase.js';
import { MemberController } from './delivery/members/MemberController.js';
import { PostgresPaymentRepository } from './infrastructure/payments/PostgresPaymentRepository.js';
import { SystemClock } from './domain/services/Clock.js';
import { CreatePaymentUseCase } from './application/payments/CreatePaymentUseCase.js';
import { UpdatePaymentUseCase } from './application/payments/UpdatePaymentUseCase.js';
import { MarkPaymentAsPaidUseCase } from './application/payments/MarkPaymentAsPaidUseCase.js';
import { CancelPaymentUseCase } from './application/payments/CancelPaymentUseCase.js';
import { GetPaymentsUseCase } from './application/payments/GetPaymentsUseCase.js';
import { PaymentController } from './delivery/payments/PaymentController.js';
import { PostgresLockerRepository } from './infrastructure/lockers/PostgresLockerRepository.js';
import { LockerValidator } from './domain/lockers/services/LockerValidator.js';
import { CreateLockerUseCase } from './application/lockers/CreateLockerUseCase.js';
import { GetLockersUseCase } from './application/lockers/GetLockersUseCase.js';
import { UpdateLockerUseCase } from './application/lockers/UpdateLockerUseCase.js';
import { DeleteLockerUseCase } from './application/lockers/DeleteLockerUseCase.js';
import { LockerController } from './delivery/lockers/LockerController.js';

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

    const lockerRepo = new PostgresLockerRepository();
    const lockerValidator = new LockerValidator(lockerRepo, memberRepo);
    const createLockerUseCase = new CreateLockerUseCase(lockerRepo, lockerValidator);
    const getLockersUseCase = new GetLockersUseCase(lockerRepo);
    const updateLockerUseCase = new UpdateLockerUseCase(lockerRepo, lockerValidator);
    const deleteLockerUseCase = new DeleteLockerUseCase(lockerRepo);
    const lockerController = new LockerController(
        createLockerUseCase,
        getLockersUseCase,
        updateLockerUseCase,
        deleteLockerUseCase
    );

    server.get('/api/v1/socios', memberController.getAll.bind(memberController));
    server.post('/api/v1/socios', memberController.create.bind(memberController));
    server.put('/api/v1/socios/:id', memberController.update.bind(memberController));
    server.delete('/api/v1/socios/:id', memberController.delete.bind(memberController));

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

    server.get('/api/v1/lockers', lockerController.getAll.bind(lockerController));
    server.post('/api/v1/lockers', lockerController.create.bind(lockerController));
    server.put('/api/v1/lockers/:id', lockerController.update.bind(lockerController));
    server.delete('/api/v1/lockers/:id', lockerController.delete.bind(lockerController));

    server.get('/', async (req, rep) => {
        rep.status(200).send({ msg: 'asd' })
    });

    return server;
}

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
