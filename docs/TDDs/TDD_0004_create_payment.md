---
id: 0004
estado: Implementado
autor: Felipe Andreau
fecha: 2026-04-30
titulo: Emision y Modificacion de Cuotas y Pagos
---

# TDD-0004: Emision y Modificacion de Cuotas y Pagos

## Contexto de Negocio (PRD)

### Objetivo

Permitir al sistema o a un administrativo generar la obligacion de pago mensual o eventual para un socio del club. Ademas, permitir la correccion de datos administrativos (monto y fecha de vencimiento) mientras el pago se encuentre en estado pendiente.

### User Persona

- Nombre: Alberto (Tesorero/Administrativo).
- Necesidad: Emitir las cuotas mensuales de los socios, generar cargos manuales o corregir errores de carga en pagos que aun no han sido cobrados ni anulados.

### Criterios de Aceptacion (Creacion)

- El sistema debe validar que el `member_id` corresponda a un socio existente.
- El sistema debe impedir la emision de pagos a socios con estado "Suspendido".
- El monto (`amount`) debe ser mayor a 0.
- El mes debe estar entre 1 y 12. El año no puede ser pasado.
- La fecha de vencimiento (`due_date`) no puede ser anterior al periodo (mes/año) facturado.

### Criterios de Aceptacion (Modificacion)

- Solo se pueden modificar pagos en estado `"Pending"`.
- Se permite editar el `amount` (debe seguir siendo > 0).
- Se permite editar la `due_date` (no puede ser anterior al periodo original).
- No se permite modificar el socio (`member_id`) ni el periodo (`month`/`year`) para preservar la integridad del registro original.

## Diseno Tecnico (RFC)

### Contrato de API (@alentapp/shared)

**Crear:** `POST /api/v1/payments` (Ver CreatePaymentRequest)

**Modificar:** `PATCH /api/v1/payments/:id`

**Request Body (UpdatePaymentRequest):**
```ts
{
  amount?: string;
  due_date?: string;
}
```

## Arquitectura y Flujo

### Lógica del Caso de Uso (UpdatePaymentUseCase)

1. **Buscar el pago:** Verificar existencia por `id`.
2. **Validar Estado:** Si el estado NO es `"Pending"`, rechazar la modificacion (Error 409 Conflict).
3. **Validar Datos:**
   - Si viene `amount`, validar que sea > 0.
   - Si viene `due_date`, validar que sea posterior o igual al periodo del pago.
4. **Persistir:** Actualizar solo los campos permitidos y retornar el DTO.

## Casos de Borde y Manejo de Errores (Adicionales)

| Escenario | Validacion / Regla de Negocio | Codigo HTTP |
|-----------|-------------------------------|-------------|
| Pago Liquidado | No se puede editar un pago ya cobrado (`Paid`) | 409 Conflict |
| Pago Anulado | No se puede editar un pago cancelado (`Canceled`) | 409 Conflict |
| Fecha Incoherente | La `due_date` es anterior al mes/año del pago | 400 Bad Request |

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
  year: number;             // Requerido, año valido
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
}
```

## Arquitectura y Flujo

### Definicion del Puerto (Repository Interface)

```ts
export interface IPaymentRepository {
  save(payment: Omit<PaymentDTO, 'id' | 'created_at' | 'updated_at'>): Promise<PaymentDTO>;
  findById(id: string): Promise<PaymentDTO | null>;
  findActiveInPeriod(memberId: string, month: number, year: number): Promise<PaymentDTO[]>;
  update(payment: PaymentDTO): Promise<PaymentDTO>;
  findAll(): Promise<PaymentDTO[]>;
}
```

### Logica del Caso de Uso (CreatePaymentUseCase)

1. **Validar los datos de entrada:**
   - `amount` debe ser un numero mayor a 0
   - `month` debe estar entre 1 y 12
   - `year` debe ser un año valido
   - `due_date` debe ser una fecha valida en formato ISO 8601

2. **Comprobar reglas de negocio:**
   - Verificar que el `member_id` corresponde a un socio existente (consultar MemberRepository)
   - Verificar que el estado del socio NO sea "Suspendido".
   - **Validar duplicados activos:** Verificar que no exista un pago con estado `Pending` o `Paid` para el mismo socio en el mismo periodo (mes/año). Si existen pagos `Canceled`, se permite crear uno nuevo.

3. **Mapear DTO a Entidad de Dominio:**
   - Asignar estado inicial `"Pending"`
   - Inicializar `payment_date` como `null`

4. **Persistir a traves del Repositorio:**
   - Llamar al metodo `save()` del `PaymentRepository`
   - Retornar la entidad creada al cliente

## Casos de Borde y Manejo de Errores

| Escenario | Validacion / Regla de Negocio | Codigo HTTP |
|-----------|-------------------------------|-------------|
| Socio inexistente | El `member_id` no corresponde a un Member existente en la BD | 400 Bad Request |
| Socio Suspendido | No se pueden emitir pagos si el `status` del socio es `"Suspendido"` | 400 Bad Request |
| Monto invalido (<= 0) | El `amount` debe ser estrictamente mayor a 0 | 400 Bad Request |
| Datos faltantes | Todos los campos marcados como requeridos deben estar presentes | 400 Bad Request |
| Periodo duplicado | Ya existe un pago Pending o Paid para el mismo socio en ese mes/año | 409 Conflict |
| Formato de fecha invalido | El `dueDate` no es un ISO 8601 valido | 400 Bad Request |
| Error de infraestructura | Falla de conexion con el contenedor de Postgres | 500 Internal Server Error |

## Observaciones Adicionales

- Se recomienda usar la libreria `date-fns` para validaciones de fechas
- Se recomienda usar `zod` para validar el DTO de entrada
- La validacion de duplicados se hace a nivel de aplicacion buscando pagos que no esten cancelados, permitiendo asi re-emitir cuotas si la anterior fue anulada.
- Los timestamps `created_at` y `updated_at` se generan automaticamente en Prisma
- La relacion con `Member` debe estar configurada correctamente en el modelo de dominio
