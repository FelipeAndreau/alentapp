import Fastify from 'fastify';
import cors from '@fastify/cors';

// INFRAESTRUCTURA (REPOS)
import { PostgresMemberRepository } from './infrastructure/members/PostgresMemberRepository.js';
import { PostgresPaymentRepository } from './infrastructure/payments/PostgresPaymentRepository.js';
import { PostgresLockerRepository } from './infrastructure/lockers/PostgresLockerRepository.js';
import { PostgresDisciplineRepository } from './infrastructure/disciplines/PostgresDisciplineRepository.js';
import { PostgresSportRepository } from './infrastructure/sports/PostgresSportRepository.js';
import { PostgresEnrollmentRepository } from './infrastructure/enrollments/PostgresEnrollmentRepository.js';

// DOMINIO (VALIDADORES Y SERVICIOS)
import { MemberValidator } from './domain/members/services/MemberValidator.js';
import { DisciplineValidator } from './domain/disciplines/services/DisciplineValidator.js';
import { LockerValidator } from './domain/lockers/services/LockerValidator.js';
import { SportValidator } from './domain/sports/services/SportValidator.js';
import { EnrollmentValidator } from './domain/enrollments/services/EnrollmentValidator.js';
import { SystemClock } from './domain/services/Clock.js';

// ERRORES DE DOMINIO PARA EL HANDLER GLOBAL
import {
    NotFoundError,
    ValidationError,
    ConflictError,
} from './domain/payments/errors/PaymentErrors.js';

// APLICACIÓN (USE CASES)
import { CreateMemberUseCase } from './application/members/NewMemberUseCase.js';
import { GetMembersUseCase } from './application/members/GetMembersUseCase.js';
import { UpdateMemberUseCase } from './application/members/UpdateMemberUseCase.js';
import { DeleteMemberUseCase } from './application/members/DeleteMemberUseCase.js';

import { CreatePaymentUseCase } from './application/payments/CreatePaymentUseCase.js';
import { UpdatePaymentUseCase } from './application/payments/UpdatePaymentUseCase.js';
import { MarkPaymentAsPaidUseCase } from './application/payments/MarkPaymentAsPaidUseCase.js';
import { CancelPaymentUseCase } from './application/payments/CancelPaymentUseCase.js';
import { GetPaymentsUseCase } from './application/payments/GetPaymentsUseCase.js';

import { CreateLockerUseCase } from './application/lockers/CreateLockerUseCase.js';
import { GetLockersUseCase } from './application/lockers/GetLockersUseCase.js';
import { UpdateLockerUseCase } from './application/lockers/UpdateLockerUseCase.js';
import { DeleteLockerUseCase } from './application/lockers/DeleteLockerUseCase.js';

import { CreateDisciplineUseCase } from './application/disciplines/CreateDisciplineUseCase.js';
import { GetDisciplinesUseCase } from './application/disciplines/GetDisciplinesUseCase.js';
import { UpdateDisciplineUseCase } from './application/disciplines/UpdateDisciplineUseCase.js';
import { DeleteDisciplineUseCase } from './application/disciplines/DeleteDisciplineUseCase.js';

import { CreateSportUseCase } from './application/sports/CreateSportUseCase.js';
import { GetSportsUseCase } from './application/sports/GetSportsUseCase.js';
import { UpdateSportUseCase } from './application/sports/UpdateSportUseCase.js';
import { DeleteSportUseCase } from './application/sports/DeleteSportUseCase.js';

import { CreateEnrollmentUseCase } from './application/enrollments/CreateEnrollmentUseCase.js';
import { GetEnrollmentsUseCase } from './application/enrollments/GetEnrollmentsUseCase.js';
import { UpdateEnrollmentUseCase } from './application/enrollments/UpdateEnrollmentUseCase.js';
import { DeleteEnrollmentUseCase } from './application/enrollments/DeleteEnrollmentUseCase.js';

// DELIVERY (CONTROLADORES)
import { MemberController } from './delivery/members/MemberController.js';
import { PaymentController } from './delivery/payments/PaymentController.js';
import { LockerController } from './delivery/lockers/LockerController.js';
import { DisciplineController } from './delivery/disciplines/DisciplineController.js';
import { SportController } from './delivery/sports/SportController.js';
import { EnrollmentController } from './delivery/enrollments/EnrollmentController.js';

export function buildApp() {
    const server = Fastify({
        logger: {
            level: 'info',
            transport:
                process.env.NODE_ENV === 'development'
                    ? {
                          target: 'pino-pretty',
                          options: {
                              translateTime: 'HH:MM:ss Z',
                              ignore: 'pid,hostname',
                          },
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

    // --- GLOBAL ERROR HANDLER ---
    server.setErrorHandler((error, request, reply) => {
        if (error instanceof NotFoundError) {
            return reply
                .status(404)
                .send({ error: error.message, code: (error as any).code });
        }
        if (error instanceof ValidationError) {
            return reply
                .status(400)
                .send({ error: error.message, code: (error as any).code });
        }
        if (error instanceof ConflictError) {
            return reply
                .status(409)
                .send({ error: error.message, code: (error as any).code });
        }
        request.log.error({ err: error }, 'Unhandled error');
        return reply.status(500).send({ error: 'Internal server error' });
    });

    // 1. INICIALIZACIÓN DE REPOS Y UTILS
    const memberRepo = new PostgresMemberRepository();
    const paymentRepo = new PostgresPaymentRepository();
    const lockerRepo = new PostgresLockerRepository();
    const disciplineRepo = new PostgresDisciplineRepository();
    const sportRepo = new PostgresSportRepository();
    const systemClock = new SystemClock();

    // 2. INICIALIZACIÓN DE SOCIOS
    const memberValidator = new MemberValidator(memberRepo);
    const createMemberUseCase = new CreateMemberUseCase(
        memberRepo,
        memberValidator,
    );
    const getMembersUseCase = new GetMembersUseCase(memberRepo);
    const updateMemberUseCase = new UpdateMemberUseCase(
        memberRepo,
        memberValidator,
    );
    const deleteMemberUseCase = new DeleteMemberUseCase(memberRepo);
    const memberController = new MemberController(
        createMemberUseCase,
        getMembersUseCase,
        updateMemberUseCase,
        deleteMemberUseCase,
    );

    // 3. INICIALIZACIÓN DE PAGOS
    const createPaymentUseCase = new CreatePaymentUseCase(
        paymentRepo,
        memberRepo,
    );
    const updatePaymentUseCase = new UpdatePaymentUseCase(paymentRepo);
    const markPaymentAsPaidUseCase = new MarkPaymentAsPaidUseCase(
        paymentRepo,
        systemClock,
    );
    const cancelPaymentUseCase = new CancelPaymentUseCase(paymentRepo);
    const getPaymentsUseCase = new GetPaymentsUseCase(paymentRepo);
    const paymentController = new PaymentController(
        createPaymentUseCase,
        updatePaymentUseCase,
        markPaymentAsPaidUseCase,
        cancelPaymentUseCase,
        getPaymentsUseCase,
    );

    // 4. INICIALIZACIÓN DE LOCKERS
    const lockerValidator = new LockerValidator(lockerRepo, memberRepo);
    const createLockerUseCase = new CreateLockerUseCase(
        lockerRepo,
        lockerValidator,
    );
    const getLockersUseCase = new GetLockersUseCase(lockerRepo);
    const updateLockerUseCase = new UpdateLockerUseCase(
        lockerRepo,
        lockerValidator,
    );
    const deleteLockerUseCase = new DeleteLockerUseCase(lockerRepo);
    const lockerController = new LockerController(
        createLockerUseCase,
        getLockersUseCase,
        updateLockerUseCase,
        deleteLockerUseCase,
    );

    // 5. INICIALIZACIÓN DE DISCIPLINAS
    const disciplineValidator = new DisciplineValidator();
    const createDisciplineUseCase = new CreateDisciplineUseCase(
        disciplineRepo,
        memberRepo,
        disciplineValidator,
    );
    const getDisciplinesUseCase = new GetDisciplinesUseCase(disciplineRepo);
    const updateDisciplineUseCase = new UpdateDisciplineUseCase(
        disciplineRepo,
        disciplineValidator,
    );
    const deleteDisciplineUseCase = new DeleteDisciplineUseCase(disciplineRepo);
    const disciplineController = new DisciplineController(
        createDisciplineUseCase,
        getDisciplinesUseCase,
        updateDisciplineUseCase,
        deleteDisciplineUseCase,
    );

    // 6. INICIALIZACIÓN DE DEPORTES
    const sportValidator = new SportValidator(sportRepo);
    const createSportUseCase = new CreateSportUseCase(
        sportRepo,
        sportValidator,
    );
    const getSportsUseCase = new GetSportsUseCase(sportRepo);
    const updateSportUseCase = new UpdateSportUseCase(
        sportRepo,
        sportValidator,
    );
    const deleteSportUseCase = new DeleteSportUseCase(sportRepo);
    const sportController = new SportController(
        createSportUseCase,
        getSportsUseCase,
        updateSportUseCase,
        deleteSportUseCase,
    );

    // 7. INICIALIZACIÓN DE INSCRIPCIONES

    // El validator necesita los 3 repositorios para sus validaciones de negocio
    const enrollmentRepo = new PostgresEnrollmentRepository();

    const enrollmentValidator = new EnrollmentValidator(
        enrollmentRepo, // para verificar duplicados y cupo
        memberRepo, // para verificar que el socio exista y esté activo
        sportRepo, // para verificar que el deporte exista y no esté dado de baja
    );
    const createEnrollmentUseCase = new CreateEnrollmentUseCase(
        enrollmentRepo,
        enrollmentValidator,
    );
    const getEnrollmentsUseCase = new GetEnrollmentsUseCase(enrollmentRepo);
    const updateEnrollmentUseCase = new UpdateEnrollmentUseCase(enrollmentRepo);
    const deleteEnrollmentUseCase = new DeleteEnrollmentUseCase(enrollmentRepo);

    const enrollmentController = new EnrollmentController(
        createEnrollmentUseCase,
        getEnrollmentsUseCase,
        updateEnrollmentUseCase,
        deleteEnrollmentUseCase,
    );

    // --- REGISTRO DE RUTAS ---

    // Rutas de Socios
    server.get(
        '/api/v1/socios',
        memberController.getAll.bind(memberController),
    );
    server.post(
        '/api/v1/socios',
        memberController.create.bind(memberController),
    );
    server.put(
        '/api/v1/socios/:id',
        memberController.update.bind(memberController),
    );
    server.delete(
        '/api/v1/socios/:id',
        memberController.delete.bind(memberController),
    );

    // Rutas de Pagos
    server.get(
        '/api/v1/payments',
        paymentController.getAll.bind(paymentController),
    );
    server.post(
        '/api/v1/payments',
        paymentController.create.bind(paymentController),
    );
    server.patch(
        '/api/v1/payments/:id',
        paymentController.update.bind(paymentController),
    );
    server.patch(
        '/api/v1/payments/:id/pay',
        paymentController.pay.bind(paymentController),
    );
    server.patch(
        '/api/v1/payments/:id/cancel',
        paymentController.cancel.bind(paymentController),
    );
    server.delete(
        '/api/v1/payments/:id',
        paymentController.deleteBlocker.bind(paymentController),
    );

    // Rutas de Lockers
    server.get(
        '/api/v1/lockers',
        lockerController.getAll.bind(lockerController),
    );
    server.post(
        '/api/v1/lockers',
        lockerController.create.bind(lockerController),
    );
    server.put(
        '/api/v1/lockers/:id',
        lockerController.update.bind(lockerController),
    );
    server.delete(
        '/api/v1/lockers/:id',
        lockerController.delete.bind(lockerController),
    );

    // Rutas de Disciplinas
    server.get(
        '/api/v1/disciplines',
        disciplineController.getAll.bind(disciplineController),
    );
    server.post(
        '/api/v1/disciplines',
        disciplineController.create.bind(disciplineController),
    );
    server.patch(
        '/api/v1/disciplines/:id',
        disciplineController.update.bind(disciplineController),
    );
    server.delete(
        '/api/v1/disciplines/:id',
        disciplineController.delete.bind(disciplineController),
    );

    // Rutas de Deportes
    server.get('/api/v1/sports', sportController.getAll.bind(sportController));
    server.post('/api/v1/sports', sportController.create.bind(sportController));
    server.patch(
        '/api/v1/sports/:id',
        sportController.update.bind(sportController),
    );
    server.delete(
        '/api/v1/sports/:id',
        sportController.delete.bind(sportController),
    );

    // Rutas de Inscripciones
    server.get(
        '/api/v1/enrollments',
        enrollmentController.getAll.bind(enrollmentController),
    );
    server.post(
        '/api/v1/enrollments',
        enrollmentController.create.bind(enrollmentController),
    );
    server.patch(
        '/api/v1/enrollments/:id',
        enrollmentController.update.bind(enrollmentController),
    );
    server.delete(
        '/api/v1/enrollments/:id',
        enrollmentController.delete.bind(enrollmentController),
    );

    // HEALTHCHECK
    server.get('/api/health', async (_req, rep) => {
        try {
            await memberRepo.findAll(); // Simple check to verify DB connection
            return rep
                .status(200)
                .send({ status: 'ok', timestamp: new Date().toISOString() });
        } catch (error) {
            return rep
                .status(503)
                .send({ status: 'error', database: 'unreachable' });
        }
    });

    server.get('/', async (req, rep) => {
        rep.status(200).send({ msg: 'Alentapp API OK' });
    });

    return server;
}

if (process.argv[1] && process.argv[1].endsWith('app.ts')) {
    const server = buildApp();
    const port = parseInt(process.env.PORT || '3000', 10);

    server.listen({ port, host: '0.0.0.0' }, () =>
        server.log.info(`API server running on http://localhost:${port}`),
    );

    ['SIGINT', 'SIGTERM'].forEach((signal) => {
        process.on(signal, async () => {
            await server.close();
            process.exit(0);
        });
    });
}
