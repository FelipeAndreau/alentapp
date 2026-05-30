import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../app.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/client/client.js';

describe('Locker API — End-to-End Tests', () => {
    let app: FastifyInstance;
    let prisma: PrismaClient;
    let createdLockerId: string;

    const randomSuffix = Math.floor(Math.random() * 100000);
    const testNumber = 90000 + randomSuffix;

    beforeAll(async () => {
        app = buildApp();
        await app.ready();

        prisma = new PrismaClient({
            adapter: new PrismaPg(process.env.DATABASE_URL as any),
        });
        await prisma.$connect();
    });

    afterAll(async () => {
        if (createdLockerId) {
            await prisma.locker.deleteMany({ where: { id: createdLockerId } });
        }
        await prisma.$disconnect();
        await app.close();
    });

    it('1. POST: debe crear un casillero en la base de datos real', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/lockers',
            payload: { number: testNumber, location: 'Vestuario E2E' },
        });

        expect(response.statusCode).toBe(201);
        const body = JSON.parse(response.payload);
        expect(body.data.id).toBeDefined();
        expect(body.data.number).toBe(testNumber);

        createdLockerId = body.data.id;

        const dbLocker = await prisma.locker.findUnique({ where: { id: createdLockerId } });
        expect(dbLocker).not.toBeNull();
        expect(dbLocker?.location).toBe('Vestuario E2E');
    });

    it('2. PUT: debe actualizar el casillero en la base de datos real', async () => {
        const response = await app.inject({
            method: 'PUT',
            url: `/api/v1/lockers/${createdLockerId}`,
            payload: { location: 'Vestuario E2E Modificado' },
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(body.data.location).toBe('Vestuario E2E Modificado');

        const dbLocker = await prisma.locker.findUnique({ where: { id: createdLockerId } });
        expect(dbLocker?.location).toBe('Vestuario E2E Modificado');
    });

    it('3. DELETE: debe eliminar el casillero de la base de datos real', async () => {
        const response = await app.inject({
            method: 'DELETE',
            url: `/api/v1/lockers/${createdLockerId}`,
        });

        expect(response.statusCode).toBe(200);

        const dbLocker = await prisma.locker.findUnique({ where: { id: createdLockerId } });
        expect(dbLocker).toBeNull();

        createdLockerId = '';
    });
});