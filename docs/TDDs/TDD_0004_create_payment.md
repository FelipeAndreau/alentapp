---
id: 0004
estado: Propuesto
autor: Felipe Andreau
fecha: 2026-04-30
titulo: Emision de Nuevas Cuotas y Pagos
---

# TDD-0004: Emision de Nuevas Cuotas y Pagos

## Contexto de Negocio (PRD)

### Objetivo

Permitir al sistema o a un administrativo generar la obligacion de pago mensual o eventual para un socio del club. Esta es la creacion de la deuda que el socio debera saldar.

### User Persona

- Nombre: Alberto (Tesorero/Administrativo).
- Necesidad: Emitir las cuotas mensuales de los socios o generar cargos manuales por deudas especificas. Necesita que el sistema valide que se le cobre al socio correcto y que la cuota quede registrada en la base de datos.

### Criterios de Aceptacion

- El sistema debe validar que el `member_id` corresponda a un socio existente en la base de datos.
- El sistema debe crear el registro con el status `"Pending"` por defecto.
- El monto (`amount`) debe ser estrictamente mayor a 0.
- La fecha de vencimiento (`due_date`) debe ser posterior a la fecha actual.
- Si la creacion es exitosa, se deben retornar los datos de la cuota generada incluyendo el `id` asignado.
- El `id` debe ser un UUID generado por el sistema.

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

**Endpoint:** `POST /api/v1/payments`

**Request Body (CreatePaymentRequest):**

```ts
{
  amount: number;           // Requerido, mayor a 0
  month: number;            // Requerido, entre 1 y 12
  year: number;             // Requerido, ano valido
  due_date: string;          // Requerido, ISO 8601 Date String (YYYY-MM-DD)
  member_id: string;         // Requerido, UUID valido
}
```

**Response Body (PaymentResponse):**

```ts
{
  id: string;
  amount: number;
  month: number;
  year: number;
  status: "Pending";
  due_date: string;
  payment_date: null;
  member_id: string;
  created_at: string;
}
```

### Esquema de Persistencia (Prisma)

```prisma
model Payment {
  id            String    @id @default(uuid())
  amount        Decimal
  month         Int
  year          Int
  status        String    @default("Pending")
  due_date      DateTime
  payment_date  DateTime?
  member_id     String
  member        Member    @relation(fields: [member_id], references: [id])
  created_at    DateTime  @default(now())
  updated_at    DateTime  @updatedAt

  @@unique([member_id, month, year])
}
```

## Arquitectura y Flujo

### Definicion del Puerto (Repository Interface)

```ts
interface IPaymentRepository {
  create(payment: Payment): Promise<Payment>;
  findById(id: string): Promise<Payment | null>;
  findByMemberId(memberId: string): Promise<Payment[]>;
  // ... otros metodos
}
```

### Logica del Caso de Uso (CreatePaymentUseCase)

1. **Validar los datos de entrada:**
   - `amount` debe ser un numero mayor a 0
   - `month` debe estar entre 1 y 12
   - `year` debe ser un ano valido
   - `due_date` debe ser una fecha valida en formato ISO 8601

2. **Comprobar reglas de negocio:**
   - Verificar que el `member_id` corresponde a un socio existente (consultar MemberRepository)
   - Validar que no exista un pago duplicado para el mismo socio en el mismo periodo (mes/ano)

3. **Mapear DTO a Entidad de Dominio:**
   - Convertir el `CreatePaymentRequest` a la entidad `Payment`
   - Asignar estado inicial `"Pending"`
   - Inicializar `payment_date` como `null`

4. **Persistir a traves del Repositorio:**
   - Llamar al metodo `create()` del `PaymentRepository`
   - Retornar la entidad creada al cliente

## Casos de Borde y Manejo de Errores

| Escenario | Validacion / Regla de Negocio | Codigo HTTP |
|-----------|-------------------------------|-------------|
| Socio inexistente | El `member_id` no corresponde a un Member existente en la BD | 400 Bad Request |
| Monto invalido (<= 0) | El `amount` debe ser estrictamente mayor a 0 | 400 Bad Request |
| Datos faltantes | Todos los campos marcados como requeridos deben estar presentes | 400 Bad Request |
| Periodo duplicado | Ya existe un pago Pending o Paid para el mismo socio en ese mes/ano | 409 Conflict |
| Formato de fecha invalido | El `dueDate` no es un ISO 8601 valido | 400 Bad Request |
| Error de infraestructura | Falla de conexion con el contenedor de Postgres | 500 Internal Server Error |

## Observaciones Adicionales

- Se recomienda usar la libreria `date-fns` para validaciones de fechas
- Se recomienda usar `zod` para validar el DTO de entrada
- El campo `@@unique([member_id, month, year])` previene la facturacion duplicada
- Los timestamps `created_at` y `updated_at` se generan automaticamente en Prisma
- La relacion con `Member` debe estar configurada correctamente en el modelo de dominio
