import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../app.js';

vi.mock(
    '../../infrastructure/enrollments/PostgresEnrollmentRepository.js',
    () => {
        return {
            PostgresEnrollmentRepository: class {
                async findAll() {
                    return [
                        {
                            id: 'enrollment-1',
                            member_id: 'member-1',
                            sport_id: 'sport-1',
                            enrollment_date: '2026-06-01T00:00:00.000Z',
                            is_active: true,
                            deleted_at: null,
                        },
                    ];
                }
                async findById(id: string) {
                    if (id === 'enrollment-1')
                        return {
                            id: 'enrollment-1',
                            member_id: 'member-1',
                            sport_id: 'sport-1',
                            enrollment_date: '2026-06-01T00:00:00.000Z',
                            is_active: true,
                            deleted_at: null,
                        };
                    if (id === 'enrollment-deleted')
                        return {
                            id: 'enrollment-deleted',
                            member_id: 'member-1',
                            sport_id: 'sport-1',
                            enrollment_date: '2026-06-01T00:00:00.000Z',
                            is_active: false,
                            deleted_at: '2026-06-01T00:00:00.000Z',
                        };
                    return null;
                }
                async findActiveByMemberAndSport(
                    memberId: string,
                    sportId: string,
                ) {
                    if (
                        memberId === 'member-duplicate' &&
                        sportId === 'sport-1'
                    )
                        return { id: 'enrollment-existing' };
                    return null;
                }
                async countActiveBySportId(sportId: string) {
                    if (sportId === 'sport-full') return 10;
                    return 0;
                }
                async create(data: any) {
                    return {
                        id: 'enrollment-new',
                        ...data,
                        enrollment_date: '2026-06-01T00:00:00.000Z',
                        is_active: true,
                        deleted_at: null,
                    };
                }
                async update(id: string, data: any) {
                    return {
                        id,
                        member_id: 'member-1',
                        sport_id: 'sport-1',
                        enrollment_date: '2026-06-01T00:00:00.000Z',
                        is_active: data.is_active ?? true,
                        deleted_at: null,
                    };
                }
                async delete(id: string) {
                    return {
                        id,
                        member_id: 'member-1',
                        sport_id: 'sport-1',
                        enrollment_date: '2026-06-01T00:00:00.000Z',
                        is_active: false,
                        deleted_at: new Date().toISOString(),
                    };
                }
            },
        };
    },
);

vi.mock('../../infrastructure/members/PostgresMemberRepository.js', () => {
    return {
        PostgresMemberRepository: class {
            async findById(id: string) {
                if (id === 'member-inactive')
                    return { id, name: 'Socio Inactivo', status: 'Moroso' };
                if (id === 'member-nonexistent') return null;
                return { id, name: 'Socio Test', status: 'Activo' };
            }
        },
    };
});

vi.mock('../../infrastructure/sports/PostgresSportRepository.js', () => {
    return {
        PostgresSportRepository: class {
            async findById(id: string) {
                if (id === 'sport-deleted')
                    return {
                        id,
                        name: 'Deporte Baja',
                        max_capacity: 10,
                        deleted_at: '2026-05-01T00:00:00.000Z',
                    };
                if (id === 'sport-full')
                    return {
                        id,
                        name: 'Deporte Lleno',
                        max_capacity: 10,
                        deleted_at: null,
                    };
                if (id === 'sport-nonexistent') return null;
                return {
                    id,
                    name: 'Fútbol',
                    max_capacity: 22,
                    deleted_at: null,
                };
            }
            async findAll() {
                return [];
            }
            async findByName() {
                return null;
            }
            async create(data: any) {
                return { id: 'sport-new', ...data, deleted_at: null };
            }
            async update(id: string, data: any) {
                return { id, ...data };
            }
            async delete() {
                return undefined;
            }
        },
    };
});

describe('Enrollment API Integration Tests', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = buildApp();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('GET /api/v1/enrollments', () => {
        it('1. debe retornar el listado de inscripciones activas (200)', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/enrollments',
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(Array.isArray(body.data)).toBe(true);
            expect(body.data[0].id).toBe('enrollment-1');
        });
    });

    describe('POST /api/v1/enrollments', () => {
        it('2. debe crear una inscripcion exitosamente (201)', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/enrollments',
                payload: { member_id: 'member-1', sport_id: 'sport-1' },
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.payload);
            expect(body.data.id).toBe('enrollment-new');
            expect(body.data.is_active).toBe(true);
        });

        it('3. debe retornar 409 si ya existe una inscripcion activa (duplicado)', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/enrollments',
                payload: { member_id: 'member-duplicate', sport_id: 'sport-1' },
            });

            expect(response.statusCode).toBe(409);
        });

        it('4. debe retornar 409 si el socio no esta activo', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/enrollments',
                payload: { member_id: 'member-inactive', sport_id: 'sport-1' },
            });

            expect(response.statusCode).toBe(409);
        });

        it('5. debe retornar 409 si el deporte esta dado de baja', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/enrollments',
                payload: { member_id: 'member-1', sport_id: 'sport-deleted' },
            });

            expect(response.statusCode).toBe(409);
        });
    });

    describe('PATCH /api/v1/enrollments/:id', () => {
        it('6. debe actualizar is_active exitosamente (200)', async () => {
            const response = await app.inject({
                method: 'PATCH',
                url: '/api/v1/enrollments/enrollment-1',
                payload: { is_active: false },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data.is_active).toBe(false);
        });

        it('7. debe retornar 404 si la inscripcion no existe', async () => {
            const response = await app.inject({
                method: 'PATCH',
                url: '/api/v1/enrollments/enrollment-inexistente',
                payload: { is_active: false },
            });

            expect(response.statusCode).toBe(404);
        });
    });

    describe('DELETE /api/v1/enrollments/:id', () => {
        it('8. debe dar de baja una inscripcion exitosamente (200)', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/enrollments/enrollment-1',
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data.deleted_at).not.toBeNull();
            expect(body.data.is_active).toBe(false);
        });

        it('9. debe retornar 404 si la inscripcion no existe', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/enrollments/enrollment-inexistente',
            });

            expect(response.statusCode).toBe(404);
        });

        it('10. debe retornar 409 si la inscripcion ya fue dada de baja', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/enrollments/enrollment-deleted',
            });

            expect(response.statusCode).toBe(409);
        });
    });
});
