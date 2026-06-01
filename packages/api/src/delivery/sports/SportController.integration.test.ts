import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../app.js';

vi.mock('../../infrastructure/members/PostgresMemberRepository.js', () => ({
    PostgresMemberRepository: class {
        async findAll() { return []; }
        async findById() { return null; }
        async findByDni() { return null; }
        async create(d: any) { return { id: 'm1', ...d }; }
        async update(id: string, d: any) { return { id, ...d }; }
        async delete() { return; }
    }
}));

vi.mock('../../infrastructure/payments/PostgresPaymentRepository.js', () => ({
    PostgresPaymentRepository: class {
        async save(d: any) { return { id: 'p1', ...d }; }
        async findById() { return null; }
        async findActiveInPeriod() { return []; }
        async update(d: any) { return d; }
        async findAll() { return []; }
    }
}));

vi.mock('../../infrastructure/lockers/PostgresLockerRepository.js', () => ({
    PostgresLockerRepository: class {
        async findAll() { return []; }
        async findById() { return null; }
        async findByNumber() { return null; }
        async create(d: any) { return { id: 'l1', ...d }; }
        async update(id: string, d: any) { return { id, ...d }; }
        async delete() { return; }
    }
}));

vi.mock('../../infrastructure/disciplines/PostgresDisciplineRepository.js', () => ({
    PostgresDisciplineRepository: class {
        async create(d: any) { return { id: 'd1', ...d }; }
        async findAll() { return []; }
        async findById() { return null; }
        async update(d: any) { return d; }
        async delete() { return; }
    }
}));

vi.mock('../../infrastructure/sports/PostgresSportRepository.js', () => {
    return {
        PostgresSportRepository: class {
            async findAll() {
                return [
                    {
                        id: 'sport-1',
                        name: 'Fútbol',
                        description: 'Fútbol 11 en cancha de césped',
                        max_capacity: 22,
                        additional_price: 500,
                        requires_medical_certificate: false,
                        deleted_at: null,
                    },
                ];
            }
            async findById(id: string) {
                if (id === 'sport-1')
                    return {
                        id: 'sport-1',
                        name: 'Fútbol',
                        description: 'Fútbol 11 en cancha de césped',
                        max_capacity: 22,
                        additional_price: 500,
                        requires_medical_certificate: false,
                        deleted_at: null,
                    };
                if (id === 'sport-deleted')
                    return {
                        id: 'sport-deleted',
                        name: 'Tenis',
                        description: 'Cancha de polvo',
                        max_capacity: 4,
                        additional_price: 150,
                        requires_medical_certificate: false,
                        deleted_at: '2026-05-01T00:00:00.000Z',
                    };
                return null;
            }
            async findByName(name: string) {
                if (name === 'Fútbol')
                    return {
                        id: 'sport-1',
                        name: 'Fútbol',
                        max_capacity: 22,
                        additional_price: 500,
                        requires_medical_certificate: false,
                        deleted_at: null,
                    };
                return null;
            }
            async create(data: any) {
                return { id: 'sport-new', ...data, deleted_at: null };
            }
            async update(id: string, data: any) {
                return {
                    id,
                    name: 'Fútbol',
                    description:
                        data.description ?? 'Fútbol 11 en cancha de césped',
                    max_capacity: data.max_capacity ?? 22,
                    additional_price: 500,
                    requires_medical_certificate: false,
                    deleted_at: null,
                };
            }
            async delete(id: string) {
                return undefined;
            }
        },
    };
});

describe('Sport API Integration Tests', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = buildApp();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('GET /api/v1/sports', () => {
        it('1. debe retornar el listado de deportes activos (200)', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/sports',
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(Array.isArray(body.data)).toBe(true);
            expect(body.data[0].id).toBe('sport-1');
        });
    });

    describe('POST /api/v1/sports', () => {
        it('2. debe crear un deporte exitosamente (201)', async () => {
            const payload = {
                name: 'Natación',
                description: 'Pileta olímpica',
                max_capacity: 30,
                additional_price: 1000,
                requires_medical_certificate: true,
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/sports',
                payload,
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.payload);
            expect(body.data.id).toBe('sport-new');
            expect(body.data.name).toBe('Natación');
        });

        it('3. debe retornar 409 si el nombre ya existe', async () => {
            const payload = {
                name: 'Fútbol',
                max_capacity: 10,
                additional_price: 0,
                requires_medical_certificate: false,
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/sports',
                payload,
            });

            expect(response.statusCode).toBe(409);
        });

        it('4. debe retornar 400 si max_capacity es cero o negativo', async () => {
            const payload = {
                name: 'Volleyball',
                max_capacity: 0,
                additional_price: 0,
                requires_medical_certificate: false,
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/sports',
                payload,
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe(
                'La capacidad máxima debe ser mayor a cero',
            );
        });
    });

    describe('PATCH /api/v1/sports/:id', () => {
        it('5. debe actualizar un deporte exitosamente (200)', async () => {
            const response = await app.inject({
                method: 'PATCH',
                url: '/api/v1/sports/sport-1',
                payload: { max_capacity: 30 },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data.max_capacity).toBe(30);
        });

        it('6. debe retornar 404 si el deporte no existe', async () => {
            const response = await app.inject({
                method: 'PATCH',
                url: '/api/v1/sports/sport-inexistente',
                payload: { max_capacity: 10 },
            });

            expect(response.statusCode).toBe(404);
        });
    });

    describe('DELETE /api/v1/sports/:id', () => {
        it('7. debe dar de baja un deporte exitosamente (200)', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/sports/sport-1',
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data.deleted_at).not.toBeNull();
        });

        it('8. debe retornar 404 si el deporte no existe', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/sports/sport-inexistente',
            });

            expect(response.statusCode).toBe(404);
        });

        it('9. debe retornar 409 si el deporte ya fue dado de baja', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/sports/sport-deleted',
            });

            expect(response.statusCode).toBe(409);
        });
    });
});
