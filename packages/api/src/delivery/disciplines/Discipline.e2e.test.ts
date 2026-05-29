import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../app.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/client/client.js';

describe('Discipline API — End-to-End Tests', () => {
    let app: FastifyInstance;
    let prisma: PrismaClient;
    let createdMemberId: string;
    let createdDisciplineId: string;

    // Sufijo aleatorio para evitar colisiones con datos de desarrollo existentes
    const randomSuffix = Math.floor(Math.random() * 100000).toString();
    const testDni = `E2EDISC${randomSuffix}`;
    const testEmail = `e2edisc${randomSuffix}@test.com`;

    beforeAll(async () => {
        // 1. Levantamos la app completa con PostgreSQL real
        app = buildApp();
        await app.ready();

        // 2. Instanciamos Prisma independiente para verificaciones directas en la DB
        prisma = new PrismaClient({
            adapter: new PrismaPg(process.env.DATABASE_URL as any),
        });
        await prisma.$connect();

        // 3. Creamos un socio real que usaremos como owner de las disciplinas
        const memberResponse = await app.inject({
            method: 'POST',
            url: '/api/v1/socios',
            payload: {
                name: 'Socio E2E Discipline',
                dni: testDni,
                email: testEmail,
                birthdate: '1990-06-15',
                category: 'Pleno',
            },
        });
        const memberBody = JSON.parse(memberResponse.payload);
        createdMemberId = memberBody.data.id;
    });

    afterAll(async () => {
        // Limpieza (tear down): eliminamos los registros creados
        if (createdDisciplineId) {
            await prisma.discipline.deleteMany({ where: { id: createdDisciplineId } });
        }
        if (createdMemberId) {
            await prisma.member.deleteMany({ where: { id: createdMemberId } });
        }
        await prisma.$disconnect();
        await app.close();
    });

    it('1. GET: debe retornar la lista de disciplinas', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/v1/disciplines',
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(Array.isArray(body.data)).toBe(true);
    });

    it('2. POST: debe crear una disciplina en la base de datos real', async () => {
        const payload = {
            reason: 'Conducta antideportiva E2E',
            start_date: '2026-06-01T00:00:00.000Z',
            end_date: '2026-08-01T00:00:00.000Z',
            is_total_suspension: false,
            member_id: createdMemberId,
        };

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/disciplines',
            payload,
        });

        expect(response.statusCode).toBe(201);
        const body = JSON.parse(response.payload);
        expect(body.data.id).toBeDefined();
        expect(body.data.reason).toBe('Conducta antideportiva E2E');
        expect(body.data.member_id).toBe(createdMemberId);

        createdDisciplineId = body.data.id;

        // Verificación directa E2E: ¿se guardó realmente en PostgreSQL?
        const dbDiscipline = await prisma.discipline.findUnique({
            where: { id: createdDisciplineId },
        });
        expect(dbDiscipline).not.toBeNull();
        expect(dbDiscipline?.deleted_at).toBeNull();
    });

    it('3. PATCH: debe actualizar la disciplina modificando la base de datos real', async () => {
        const response = await app.inject({
            method: 'PATCH',
            url: `/api/v1/disciplines/${createdDisciplineId}`,
            payload: { reason: 'Conducta antideportiva E2E — actualizada' },
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(body.data.reason).toBe('Conducta antideportiva E2E — actualizada');

        // Verificación directa en PostgreSQL
        const dbDiscipline = await prisma.discipline.findUnique({
            where: { id: createdDisciplineId },
        });
        expect(dbDiscipline?.reason).toBe('Conducta antideportiva E2E — actualizada');
    });

    it('4. DELETE: debe realizar un delete LÓGICO (deleted_at se setea, el registro persiste)', async () => {
        const response = await app.inject({
            method: 'DELETE',
            url: `/api/v1/disciplines/${createdDisciplineId}`,
        });

        expect(response.statusCode).toBe(204);

        // Verificación E2E clave: el registro debe SEGUIR EXISTIENDO en la DB pero con deleted_at seteado
        const dbDiscipline = await prisma.discipline.findUnique({
            where: { id: createdDisciplineId },
        });
        expect(dbDiscipline).not.toBeNull();
        expect(dbDiscipline?.deleted_at).not.toBeNull();

        // GET no debe retornar la disciplina eliminada lógicamente
        const getResponse = await app.inject({
            method: 'GET',
            url: '/api/v1/disciplines',
        });
        const listBody = JSON.parse(getResponse.payload);
        const foundInList = listBody.data.some(
            (d: any) => d.id === createdDisciplineId,
        );
        expect(foundInList).toBe(false);
    });
});
