---
id: 0006
estado: Implementado
autor: Felipe Andreau
fecha: 2026-04-30
titulo: Anulacion de Cuotas (Inmutabilidad)
---

# TDD-0006: Anulacion de Cuotas (Inmutabilidad)

## Contexto de Negocio (PRD)

### Objetivo

Permitir a la tesoreria invalidar un pago o cuota que se haya generado por error (por ejemplo, doble facturacion mensual). Por normativa de auditoria estricta, se aplica una regla de **inmutabilidad**: no se puede borrar el registro fisicamente, solo marcarlo como anulado.

### User Persona

- Nombre: Alberto (Tesorero/Administrativo).
- Necesidad: Subsanar errores de facturacion sin romper el historial contable del club. Requiere un boton "Anular" para invalidar un recibo erroneo, garantizando que el registro permanezca en la BD como historico pero no afecte al estado actual del socio.

### Criterios de Aceptacion

- El sistema **NO** debe permitir la eliminacion fisica (hard delete) de registros de la tabla `Payment` bajo ninguna circunstancia.
- El sistema debe exponer un endpoint para cambiar el estado de un pago a `"Canceled"`.
- Al anular un pago, se debe limpiar el campo `payment_date` (si existia), dejandolo en `null`.
- Si se intenta enviar una solicitud `DELETE` directa, el sistema debe rechazarla explicitamente con un codigo HTTP 405.
- Un pago anulado no puede volver a cobrarse.
- Se debe retornar la cuota actualizada con status `"Canceled"`.

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

**Endpoint de Anulacion:** `PATCH /api/v1/payments/:id/cancel`

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
  status: "Canceled";
  due_date: string;
  payment_date: null;      // Limpiado al anular
  member_id: string;
  created_at: string;
  updated_at: string;
}
```

**Endpoint Bloqueado (No Permitido):** `DELETE /api/v1/payments/:id`

**Response Body (para DELETE bloqueado):**

```ts
{
  error: "Method Not Allowed",
  message: "La eliminacion fisica de pagos esta prohibida por politica de auditoria. Use el endpoint PATCH /payments/:id/cancel para anular.",
  code: "IMMUTABILITY_POLICY"
}
```

### Esquema de Persistencia (Prisma)

*Sin cambios en el esquema. Solo se actualiza el registro existente.*

## Arquitectura y Flujo

### Definicion del Puerto (Repository Interface)

```ts
interface IPaymentRepository {
  findById(id: string): Promise<Payment | null>;
  updateStatus(id: string, status: string, paymentDate?: Date | null): Promise<Payment>;
  // Nota: NO debe incluir un metodo delete() generico
}
```

### Logica del Caso de Uso (CancelPaymentUseCase)

1. **Buscar el pago por ID:**
   - Consultar al `PaymentRepository` para obtener el pago actual
   - Si no existe, lanzar error 404

2. **Validar estado actual:**
   - Si el status es `"Paid"`: lanzar error 409 (no se puede anular lo ya cobrado, es auditoria)
   - Si el status es `"Canceled"`: retornar silenciosamente con 200 (idempotencia)
   - Si el status es `"Pending"`: continuar con la anulacion

3. **Actualizar el estado:**
   - Cambiar status a `"Canceled"`
   - Limpiar `payment_date` a `null` (el pago nunca se efectuo)

4. **Persistir cambios:**
   - Llamar a `updateStatus()` del repositorio
   - Retornar el pago actualizado

### Controlador (PaymentController)

**El controlador debe:**
- Exponer un endpoint `PATCH /payments/:id/cancel` que invoque `CancelPaymentUseCase`
- Configurar explicitamente un manejador para `DELETE /payments/:id` que retorne HTTP 405 con el mensaje de politica de inmutabilidad
- **NO** permitir que Prisma o ningun otro adaptador exponga un endpoint de eliminacion generico

```ts
// Pseudocodigo ilustrativo
app.delete('/payments/:id', (req, res) => {
  res.status(405).json({
    error: 'Method Not Allowed',
    message: 'La eliminacion fisica de pagos esta prohibida por politica de auditoria. Use PATCH /payments/:id/cancel',
    code: 'IMMUTABILITY_POLICY'
  });
});
```

## Casos de Borde y Manejo de Errores

| Escenario | Validacion / Regla de Negocio | Codigo HTTP |
|-----------|-------------------------------|-------------|
| Intento de DELETE fisico | La eliminacion fisica esta bloqueada por politica de inmutabilidad | 405 Method Not Allowed |
| Pago inexistente | El `id` no existe en la BD | 404 Not Found |
| Pago ya cobrado ("Paid") | No se puede anular un pago gia cobrado; revertir primero o contactar a administracion | 409 Conflict |
| Pago ya anulado ("Canceled") | Retorno silencioso exitoso (idempotencia) | 200 OK |
| ID invalido (no UUID) | El formato del `id` es invalido | 400 Bad Request |
| Error de infraestructura | Falla de conexion con Postgres | 500 Internal Server Error |

## Observaciones Adicionales

- **Politica de Auditoria**: La regla de inmutabilidad es un requisito regulatorio no-negociable. Ningun registro de pago debe poder ser eliminado fisicamente.
- **Ciclo de Vida Completo**: Un pago solo puede transitar: `Pending` -> `Paid` o `Pending` -> `Canceled`. No se permite revertir un `Paid` a `Pending` (para eso se necesaria una entidad de "Reversal" o "Refund" separada).
- **Frontend**: Reemplazar los botones de "Eliminar" genericos por "Anular" especificos para esta entidad.
- **Auditoria**: El campo `updated_at` se actualiza automaticamente, dejando constancia de cuando se anulo.
- **Logs**: Se recomienda agregar logging a nivel de infraestructura para registrar intentos de eliminacion fisica.
- **Idempotencia**: Anular un pago que ya esta anulado debe retornar 200 OK sin errores.
