import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../app.js';

vi.mock('../../infrastructure/lockers/PostgresLockerRepository.js', () => {
    return {
        PostgresLockerRepository: class {
            async findAll() {
                return [{ id: 'uuid-1', number: 1, location: 'Vestuario Masculino', status: 'Available', member_id: null }];
            }
            async findById(id: string) {
                return id === 'uuid-1'
                    ? { id: 'uuid-1', number: 1, location: 'Vestuario Masculino', status: 'Available', member_id: null }
                    : null;
            }
            async findByNumber(number: number) {
                return number === 1
                    ? { id: 'uuid-1', number: 1, location: 'Vestuario Masculino', status: 'Available', member_id: null }
                    : null;
            }
            async create(d: any) { return { id: 'uuid-2', ...d }; }
            async update(id: string, d: any) { return { id, ...d }; }
            async delete() { return; }
        }
    };
});

vi.mock('../../infrastructure/members/PostgresMemberRepository.js', () => {
    return {
        PostgresMemberRepository: class {
            async findAll() { return []; }
            async findById(id: string) { return id === 'member-1' ? { id: 'member-1', name: 'Socio Test' } : null; }
            async findByDni() { return null; }
            async create(d: any) { return { id: 'member-1', ...d }; }
            async update(id: string, d: any) { return { id, ...d }; }
            async delete() { return; }
        }
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
        }
    };
});

vi.mock('../../infrastructure/disciplines/PostgresDisciplineRepository.js', () => {
    return {
        PostgresDisciplineRepository: class {
            async create(d: any) { return { id: 'd1', ...d }; }
            async findAll() { return []; }
            async findById() { return null; }
            async update(d: any) { return d; }
            async delete() { return; }
        }
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
        }
    };
});

describe('Locker API – Integration Tests', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = buildApp();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('GET /api/v1/lockers', () => {
        it('1. debe retornar 200 con el listado de casilleros', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/lockers',
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(Array.isArray(body.data)).toBe(true);
            expect(body.data[0].number).toBe(1);
        });
    });

    describe('POST /api/v1/lockers', () => {
        it('2. debe retornar 201 y crear el casillero', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/lockers',
                payload: { number: 99, location: 'Vestuario Femenino' },
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.payload);
            expect(body.data.number).toBe(99);
        });

        it('3. debe retornar 409 si el número ya existe', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/lockers',
                payload: { number: 1, location: 'Vestuario' },
            });

            expect(response.statusCode).toBe(409);
            const body = JSON.parse(response.payload);
            expect(body.error).toContain('casillero');
        });

        it('4. debe retornar 400 si el número es 0 o negativo', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/lockers',
                payload: { number: 0, location: 'Vestuario' },
            });

            expect(response.statusCode).toBe(400);
        });
    });

    describe('PUT /api/v1/lockers/:id', () => {
        it('7. debe retornar 200 y actualizar el casillero', async () => {
            const response = await app.inject({
                method: 'PUT',
                url: '/api/v1/lockers/uuid-1',
                payload: { location: 'Vestuario Actualizado' },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data).toBeDefined();
        });
    });

    describe('DELETE /api/v1/lockers/:id', () => {
        it('5. debe retornar 200 si se elimina correctamente', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/lockers/uuid-1',
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.message).toBe('Casillero eliminado correctamente');
        });

        it('6. debe retornar 404 si el casillero no existe', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/lockers/uuid-999',
            });

            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('No existe un casillero con ese ID');
        });
    });
});