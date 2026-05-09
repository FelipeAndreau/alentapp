---
id: 0005
estado: Implementado
autor: Felipe Andreau
fecha: 2026-04-30
titulo: Registro de Cobro de Cuotas
---

# TDD-0005: Registro de Cobro de Cuotas

## Contexto de Negocio (PRD)

### Objetivo

Permitir a los administrativos registrar en el sistema cuando un socio efectua el pago de su cuota o deuda, actualizando el estado financiero de inmediato y dejando constancia del momento exacto del cobro para auditoria.

### User Persona

- Nombre: Alberto (Tesorero/Administrativo).
- Necesidad: Registrar cobros rapidamente cuando los socios abonan en secretaria, asegurando que su estado de cuenta quede actualizado al instante y que el historial financiero sea inmutable para auditorias.

### Criterios de Aceptacion

- El sistema debe cambiar el status del pago de `"Pending"` a `"Paid"`.
- El sistema debe asignar automaticamente la fecha y hora actual en el campo `payment_date` al momento del registro.
- El sistema debe comportarse de forma **idempotente**: si se intenta registrar el cobro de una cuota que ya esta `"Paid"`, debe retornar exito (HTTP 200) sin duplicar ingresos ni arrojar error.
- Si la cuota esta en estado `"Canceled"`, el sistema debe rechazar el cobro con un mensaje claro.
- Se debe retornar la cuota actualizada con el nuevo estado y `payment_date`.

## Diseno Tecnico (RFC)

### Modelo de Dominio (Entidad)

```ts
interface Payment {
  id: string; // UUID
  amount: number;
  month: number;
  year: number;
  status: "Pending" | "Paid" | "Canceled";
  due_date: Date;
  payment_date: Date | null;
  member_id: string; // UUID
  created_at?: Date;
  updated_at?: Date;
}
```

### Contrato de API (@alentapp/shared)

**Endpoint:** `PATCH /api/v1/payments/:id/pay`

**Request Body:** 
```ts
{
  // No requiere cuerpo, la intencion esta en la URL
}
```

**Response Body (PaymentResponse):**

```ts
{
  id: string;
  amount: number;
  month: number;
  year: number;
  status: "Paid";
  due_date: string;
  payment_date: string;    // ISO 8601 DateTime String
  member_id: string;
  created_at: string;
  updated_at: string;
}
```

### Esquema de Persistencia (Prisma)

*Sin cambios en el esquema. Solo se actualiza el registro existente.*

## Arquitectura y Flujo

### Definicion del Puerto (Repository Interface)

```ts
interface IPaymentRepository {
  findById(id: string): Promise<Payment | null>;
  updateStatus(id: string, status: string, paymentDate?: Date): Promise<Payment>;
  // ... otros metodos
}
```

### Logica del Caso de Uso (MarkPaymentAsPaidUseCase)

1. **Buscar el pago por ID:**
   - Consultar al `PaymentRepository` para obtener el pago actual
   - Si no existe, lanzar error 404

2. **Validar estado actual:**
   - Si el status es `"Paid"`: retornar exito silenciosamente (idempotencia)
   - Si el status es `"Canceled"`: lanzar error 409 (no se puede cobrar lo cancelado)
   - Si el status es `"Pending"`: continuar con el cobro

3. **Actualizar el estado:**
   - Cambiar status a `"Paid"`
   - Asignar `payment_date` a la hora actual (usar inyeccion de dependencia de reloj para testabilidad)

4. **Persistir cambios:**
   - Llamar a `updateStatus()` del repositorio
   - Retornar el pago actualizado

## Casos de Borde y Manejo de Errores

| Escenario | Validacion / Regla de Negocio | Codigo HTTP |
|-----------|-------------------------------|-------------|
| Pago inexistente | El `id` no existe en la BD | 404 Not Found |
| Pago ya cobrado ("Paid") | Retorno exitoso silencioso (idempotencia) | 200 OK |
| Pago anulado ("Canceled") | No se puede cobrar un pago en estado cancelado | 409 Conflict |
| ID invalido (no UUID) | El formato del `id` es invalido | 400 Bad Request |
| Error de infraestructura | Falla de conexion con Postgres | 500 Internal Server Error |

## Observaciones Adicionales

- **Idempotencia**: Es crucial que la operacion sea idempotente para evitar duplicados en cobros por reintentos de red.
- **Inyeccion de Reloj**: Se recomienda inyectar una dependencia de tipo `Clock` para que `payment_date` sea testeable (en tests se puede usar una fecha fija).
- **Transaccionalidad**: Si la aplicacion crece, considerar usar transacciones para garantizar consistencia.
- **Auditoria**: Al cambiar el status, el campo `updated_at` se actualiza automaticamente en Prisma.
- **Concurrencia**: Dos solicitudes simultaneas para el mismo pago deberian resultar en solo una actualizacion exitosa (considera usar `findUniqueOrThrow` con transacciones si es necesario).
