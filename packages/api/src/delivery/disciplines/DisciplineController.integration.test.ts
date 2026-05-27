import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../app.js';
import { CreateDisciplineRequest } from '@alentapp/shared';

// Mockeamos todos los repositorios para evitar dependencia con la base de datos real.
// Esto permite testear la integración completa: Fastify → DisciplineController → UseCase → Validator

vi.mock('../../infrastructure/disciplines/PostgresDisciplineRepository.js', () => {
    return {
        PostgresDisciplineRepository: class {
            async create(data: any) {
                return {
                    id: 'disc-id-1',
                    reason: data.reason,
                    start_date: data.start_date,
                    end_date: data.end_date,
                    is_total_suspension: data.is_total_suspension,
                    member_id: data.member_id,
                };
            }
            async findAll() {
                return [
                    {
                        id: 'disc-id-1',
                        reason: 'Agresión verbal',
                        start_date: '2026-06-01T00:00:00.000Z',
                        end_date: '2026-07-01T00:00:00.000Z',
                        is_total_suspension: false,
                        member_id: 'member-id-1',
                    },
                ];
            }
            async findById(id: string) {
                if (id === 'disc-id-1') {
                    return {
                        id: 'disc-id-1',
                        reason: 'Agresión verbal',
                        start_date: '2026-06-01T00:00:00.000Z',
                        end_date: '2026-07-01T00:00:00.000Z',
                        is_total_suspension: false,
                        member_id: 'member-id-1',
                    };
                }
                return null;
            }
            async update(data: any) {
                return data;
            }
            async delete(_id: string) {
                return;
            }
        },
    };
});

vi.mock('../../infrastructure/members/PostgresMemberRepository.js', () => {
    return {
        PostgresMemberRepository: class {
            async findById(id: string) {
                if (id === 'non-existent-member') return null;
                return { id, name: 'Socio Test', status: 'Activo' };
            }
            async findAll() { return []; }
            async findByDni() { return null; }
            async create(d: any) { return { id: 'new-member', ...d }; }
            async update(id: string, d: any) { return { id, ...d }; }
            async delete() { return; }
        },
    };
});

vi.mock('../../infrastructure/payments/PostgresPaymentRepository.js', () => {
    return {
        PostgresPaymentRepository: class {
            async save(d: any) { return { id: 'p1', ...d }; }
            async findById() { return null; }
            async findActiveInPeriod() { return []; }
            async update(d: any) { return d; }
            async findAll() { return []; }
            async delete() { return; }
        },
    };
});

vi.mock('../../infrastructure/lockers/PostgresLockerRepository.js', () => {
    return {
        PostgresLockerRepository: class {
            async create(d: any) { return { id: 'l1', ...d }; }
            async findAll() { return []; }
            async findById() { return null; }
            async findByNumber() { return null; }
            async update(id: string, d: any) { return { id, ...d }; }
            async delete() { return; }
        },
    };
});

vi.mock('../../infrastructure/sports/PostgresSportRepository.js', () => {
    return {
        PostgresSportRepository: class {
            async create(d: any) { return { id: 's1', ...d }; }
            async findAll() { return []; }
            async findById() { return null; }
            async findByName() { return null; }
            async update(id: string, d: any) { return { id, ...d }; }
            async delete() { return; }
        },
    };
});

describe('Discipline API — Integration Tests', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = buildApp();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('GET /api/v1/disciplines', () => {
        it('1. debe retornar 200 con el listado de disciplinas', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/disciplines',
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(Array.isArray(body.data)).toBe(true);
            expect(body.data[0].id).toBe('disc-id-1');
        });
    });

    describe('POST /api/v1/disciplines', () => {
        it('2. debe retornar 201 y crear la disciplina cuando los datos son válidos', async () => {
            const payload: CreateDisciplineRequest = {
                reason: 'Conducta antideportiva',
                start_date: '2026-06-01T00:00:00.000Z',
                end_date: '2026-07-01T00:00:00.000Z',
                is_total_suspension: false,
                member_id: 'member-id-1',
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/disciplines',
                payload,
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.payload);
            expect(body.data.id).toBe('disc-id-1');
            expect(body.data.member_id).toBe('member-id-1');
        });

        it('3. debe retornar 400 cuando end_date no es posterior a start_date', async () => {
            const payload: CreateDisciplineRequest = {
                reason: 'Fechas inválidas',
                start_date: '2026-07-01T00:00:00.000Z',
                end_date: '2026-06-01T00:00:00.000Z', // end_date < start_date
                is_total_suspension: false,
                member_id: 'member-id-1',
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/disciplines',
                payload,
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('La fecha de fin debe ser posterior a la de inicio');
        });

        it('4. debe retornar 404 cuando el member_id no corresponde a un socio existente', async () => {
            const payload: CreateDisciplineRequest = {
                reason: 'Socio inexistente',
                start_date: '2026-06-01T00:00:00.000Z',
                end_date: '2026-07-01T00:00:00.000Z',
                is_total_suspension: false,
                member_id: 'non-existent-member',
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/disciplines',
                payload,
            });

            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.payload);
            expect(body.code).toBe('MEMBER_NOT_FOUND');
        });
    });

    describe('PATCH /api/v1/disciplines/:id', () => {
        it('5. debe retornar 200 y actualizar la disciplina con los nuevos datos', async () => {
            const response = await app.inject({
                method: 'PATCH',
                url: '/api/v1/disciplines/disc-id-1',
                payload: { reason: 'Motivo actualizado' },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data.reason).toBe('Motivo actualizado');
        });

        it('6. debe retornar 200 con la disciplina sin cambios cuando el body está vacío', async () => {
            const response = await app.inject({
                method: 'PATCH',
                url: '/api/v1/disciplines/disc-id-1',
                payload: {},
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data.id).toBe('disc-id-1');
            expect(body.data.reason).toBe('Agresión verbal');
        });
    });

    describe('DELETE /api/v1/disciplines/:id', () => {
        it('7. debe retornar 204 cuando la disciplina existe (delete lógico)', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/disciplines/disc-id-1',
            });

            expect(response.statusCode).toBe(204);
            expect(response.payload).toBe('');
        });

        it('8. debe retornar 404 cuando la disciplina no existe', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/disciplines/non-existent-disc',
            });

            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.payload);
            expect(body.code).toBe('DISCIPLINE_NOT_FOUND');
        });
    });
});
