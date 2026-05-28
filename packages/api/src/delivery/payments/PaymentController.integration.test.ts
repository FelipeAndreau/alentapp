import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../app.js';
import { CreatePaymentRequest } from '@alentapp/shared';

vi.mock('../../infrastructure/payments/PostgresPaymentRepository.js', () => {
  return {
    PostgresPaymentRepository: class {
      async findAll() { 
        return [{ id: 'p1', amount: '1000', month: 5, year: 2026, status: 'Pending', member_id: 'm1' }]; 
      }
      async findById(id: string) {
        if (id === 'p1') return { id: 'p1', amount: '1000', month: 5, year: 2026, status: 'Pending', member_id: 'm1' };
        if (id === 'paid-1') return { id: 'paid-1', status: 'Paid' };
        return null;
      }
      async findActiveInPeriod(memberId: string, month: number, year: number) {
        if (memberId === 'm-conflict') return [{ id: 'existing' }];
        return [];
      }
      async save(data: any) {
        return { id: 'new-p', ...data };
      }
      async update(data: any) {
        return data;
      }
    }
  };
});

vi.mock('../../infrastructure/members/PostgresMemberRepository.js', () => {
  return {
    PostgresMemberRepository: class {
      async findById(id: string) {
        if (id === 'non-existent') return null;
        return { id, name: 'Socio Test', status: 'Activo' };
      }
    }
  };
});

describe('Payment API Integration Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/payments', () => {
    it('1. debe crear un pago exitosamente (201)', async () => {
      const payload: CreatePaymentRequest = {
        amount: '1500',
        month: 6,
        year: 2026,
        due_date: '2026-06-10',
        member_id: 'm1'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/payments',
        payload
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.payload);
      expect(body.data.id).toBe('new-p');
    });

    it('2. debe retornar 400 si el monto es invalido', async () => {
      const payload = {
        amount: '0',
        month: 6,
        year: 2026,
        due_date: '2026-06-10',
        member_id: 'm1'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/payments',
        payload
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.payload).error).toBe('El monto debe ser mayor a 0');
    });

    it('3. debe retornar 409 si ya existe un pago activo', async () => {
      const payload = {
        amount: '1000',
        month: 5,
        year: 2026,
        due_date: '2026-05-10',
        member_id: 'm-conflict'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/payments',
        payload
      });

      expect(response.statusCode).toBe(409);
    });
  });

  describe('GET /api/v1/payments', () => {
    it('4. debe retornar el listado de pagos (200)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/payments'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data[0].id).toBe('p1');
    });
  });

  describe('PATCH /api/v1/payments/:id/pay', () => {
    it('5. debe marcar como pagado (200)', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/payments/p1/pay'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.data.status).toBe('Paid');
    });

    it('7. debe ser idempotente si ya esta pagado (200)', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/payments/paid-1/pay'
      });

      expect(response.statusCode).toBe(200);
    });

    it('8. debe retornar 404 si el pago no existe', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/payments/non-existent/pay'
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('PATCH /api/v1/payments/:id/cancel', () => {
    it('6. debe anular un pago (200)', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/payments/p1/cancel'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.data.status).toBe('Canceled');
    });
  });

  describe('DELETE /api/v1/payments/:id', () => {
    it('9. debe rechazar la eliminacion fisica con 405 (Inmutabilidad)', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/payments/p1'
      });

      expect(response.statusCode).toBe(405);
      const body = JSON.parse(response.payload);
      expect(body.code).toBe('IMMUTABILITY_POLICY');
    });
  });
});
