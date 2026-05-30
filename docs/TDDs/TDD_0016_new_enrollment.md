---
id: 16
estado: Propuesto
autor: Maximo Carpignano
fecha: 2026-05-10
titulo: Registro de Nueva Inscripción
---

# TDD-0016: Registro de Nueva Inscripción

## Contexto de Negocio (PRD)

### Objetivo

Permitir que un administrativo registre la inscripción de un socio a un deporte, asegurando que se respeten las reglas de negocio definidas: cupo máximo del deporte, estado del socio, existencia del deporte, y ausencia de inscripciones activas duplicadas.

### User Persona

- **Nombre**: Adolfo Gaich (Administrativo del Club).
- **Necesidad**: Inscribir socios a deportes disponibles de forma segura, garantizando que el deporte tenga cupo disponible, que el socio esté habilitado para inscribirse y evitando duplicar inscripciones activas para el mismo socio y deporte.

### Criterios de Aceptación

- El sistema debe permitir registrar una inscripción proporcionando `member_id` y `sport_id`.
- El sistema debe validar que `member_id` sea obligatorio.
- El sistema debe validar que `sport_id` sea obligatorio.
- El sistema debe validar que el socio referenciado exista en el sistema.
- El sistema debe validar que el deporte referenciado exista en el sistema.
- El sistema debe validar que el deporte no haya sido dado de baja (`deleted_at` tiene que ser `null`).
- El sistema debe validar que el socio tenga `estadoCuenta` igual a `Active`.
- El sistema debe validar que no exista otra inscripción con `is_active = true` y `deleted_at = null` para el mismo `member_id` y `sport_id`.
- El sistema debe validar que la cantidad de inscripciones activas del deporte sea estrictamente menor a `Sport.max_capacity`. Si es igual o mayor, la inscripción debe rechazarse.
- El sistema debe generar automáticamente `enrollment_date` con la fecha y hora actuales del servidor al momento de la creación.
- El sistema debe inicializar `is_active` en `true`.
- El sistema debe inicializar `deleted_at` en `null`.
- En caso de creacion exitosa, el sistema debe responder con estado `201 Created` y retornar la inscripción creada.

---

## Diseño Técnico (RFC)

### Modelo de Datos

Se incorpora la entidad `Enrollment` al esquema de Prisma con la siguiente estructura:

- `id`: Identificador único universal (UUID).
- `member_id`: UUID, referencia al socio inscripto. **Inmutable post-creación**.
- `sport_id`: UUID, referencia al deporte asociado. **Inmutable post-creación**.
- `enrollment_date`: DateTime, fecha y hora de inscripción generada automáticamente por el servidor al momento de la creación. **Inmutable post-creación**.
- `is_active`: Booleano, indica si la inscripción está vigente. Se inicializa en `true`.
- `deleted_at`: DateTime, marca de baja lógica. `null` indica que la inscripción está activa; si tiene valor, indica que fue eliminada lógicamente (soft delete).

### Reglas de Negocio

- Solo se consideran inscripciones activas aquellas con `is_active = true` y `deleted_at = null`.
- Para validar el cupo disponible, el sistema debe contar las inscripciones activas del deporte y compararlas con `Sport.max_capacity`.
- Si la cantidad de inscripciones activas es mayor o igual a `Sport.max_capacity`, la inscripción debe rechazarse.
- Un deporte con `deleted_at` distinto de `null` no puede recibir nuevas inscripciones.
- Solo los socios con `account_status = Active` pueden inscribirse. Los estados `Delinquent` e `Inactive` deben ser rechazados.
- El campo `member_id` no puede modificarse una vez creada la inscripción (aplica a futuros TDDs de actualización).

---

## Contrato de API (`@alentapp/shared`)

Se definen los siguientes tipos en el paquete compartido:

```ts
export interface EnrollmentDTO {
    id: string; // UUID de la inscripción
    member_id: string; // UUID del socio inscripto
    sport_id: string; // UUID del deporte asociado
    enrollment_date: string; // ISO 8601 DateTime. Fecha y hora de inscripción
    is_active: boolean; // true = inscripción vigente
    deleted_at: string | null; // ISO 8601 DateTime. null = activo; con valor = eliminado lógicamente
}

export interface CreateEnrollmentRequest {
    member_id: string; // Requerido. UUID del socio
    sport_id: string; // Requerido. UUID del deporte
}
```

- **Endpoint**: `POST /api/v1/enrollments`

- **Request Body**:

```ts
{
    member_id: string;
    sport_id: string;
}
```

- **Response exitosa** (`201 Created`):

```ts
{
    data: EnrollmentDTO;
}
```

---

## Componentes de Arquitectura Hexagonal

- **Puerto**: `EnrollmentRepository` (interfaz en el Dominio) — define el contrato de persistencia con los métodos `create`, `findById`, `findAll`, `findActiveByMemberAndSport`, `countActiveBySportId`, `update` y `softDelete`. Se define completo desde el inicio para que los casos de uso de alta, consulta, modificación y baja compartan la misma interfaz sin necesidad de modificarla.

- **Servicio de Dominio**: `EnrollmentValidator` — encapsula todas las reglas de negocio de la inscripción: valida que el socio exista y tenga `account_status = Active`, que el deporte exista y no esté eliminado lógicamente, que no haya una inscripción activa duplicada para el mismo par `member_id`/`sport_id`, y que el cupo del deporte no esté completo.

- **Caso de Uso**: `CreateEnrollmentUseCase` — orquesta el flujo de creación sin conocer HTTP ni la base de datos. Recibe `member_id` y `sport_id`, delega todas las validaciones a `EnrollmentValidator` inyectando los repositorios necesarios, y persiste la nueva inscripción vía `EnrollmentRepository.create`.

- **Adaptador de Salida**: `PostgresEnrollmentRepository` — implementación concreta del puerto `EnrollmentRepository` usando Prisma. Expone los métodos `create`, `findActiveByMemberAndSport` y `countActiveBySportId` para este caso de uso, y mapea el resultado a `EnrollmentDTO`.

- **Adaptador de Entrada**: `EnrollmentController` — expone `POST /api/v1/enrollments` en Fastify, valida el body tipado como `CreateEnrollmentRequest`, delega al caso de uso y devuelve `201 Created` con `{ data: EnrollmentDTO }`. Mapea las excepciones de dominio a los códigos HTTP correspondientes. La ruta y las dependencias se registran en `app.ts`.

---

## Casos de Borde y Errores

| Escenario                                       | Resultado Esperado                                                  | Código HTTP               |
| ----------------------------------------------- | ------------------------------------------------------------------- | ------------------------- |
| `member_id` ausente en el body                  | Mensaje: "El campo member_id es obligatorio"                        | 400 Bad Request           |
| `sport_id` ausente en el body                   | Mensaje: "El campo sport_id es obligatorio"                         | 400 Bad Request           |
| `member_id` o `sport_id` con formato no UUID    | Mensaje: "Identificador con formato inválido"                       | 400 Bad Request           |
| Socio no encontrado                             | Mensaje: "Socio no encontrado"                                      | 404 Not Found             |
| Deporte no encontrado                           | Mensaje: "Deporte no encontrado"                                    | 404 Not Found             |
| Deporte eliminado lógicamente                   | Mensaje: "No se puede inscribir en un deporte dado de baja"         | 409 Conflict              |
| Socio con `account_status` distinto de `Active` | Mensaje: "El socio no está habilitado para inscribirse"             | 409 Conflict              |
| Ya existe inscripción activa para ese par       | Mensaje: "El socio ya tiene una inscripción activa en este deporte" | 409 Conflict              |
| Cupo del deporte completo                       | Mensaje: "No hay cupo disponible para este deporte"                 | 409 Conflict              |
| Error de conexión a la base de datos            | Mensaje: "Error interno, reintente más tarde"                       | 500 Internal Server Error |

---

## Plan de Implementación

1. Agregar `EnrollmentDTO` y `CreateEnrollmentRequest` al paquete `@alentapp/shared` (`packages/shared/index.ts`).
2. Modificar el esquema de persistencia (`schema.prisma`): agregar el modelo `Enrollment` con el campo `deleted_at` como nullable y definir las relaciones con `Member` y `Sport`.
3. Ejecutar la migración de base de datos con el nombre `create_enrollments_table`.
4. Crear el puerto `EnrollmentRepository.ts` en `src/domain/` con los métodos del ciclo de vida completo: `create`, `findById`, `findAll`, `findActiveByMemberAndSport`, `countActiveBySportId`, `update` y `softDelete`.
5. Crear el servicio de dominio `EnrollmentValidator.ts` en `src/domain/services/`, inyectando `EnrollmentRepository`, `MemberRepository` y `SportRepository` para ejecutar todas las validaciones de negocio.
6. Implementar `CreateEnrollmentUseCase.ts` en `src/application/`, orquestando el flujo y delegando al validador y al repositorio.
7. Implementar `PostgresEnrollmentRepository.ts` en `src/infrastructure/` con el método `create` y mapeo a `EnrollmentDTO`.
8. Implementar las consultas auxiliares `findActiveByMemberAndSport` y `countActiveBySportId` en `PostgresEnrollmentRepository`.
9. Crear `EnrollmentController.ts` en `src/delivery/` con el método `create` y mapeo de excepciones de dominio a códigos HTTP.
10. Registrar las dependencias y la ruta `POST /api/v1/enrollments` en `src/app.ts`.
11. Agregar el método `createEnrollment` al servicio frontend y conectarlo con el formulario de inscripción en React.
12. Crear o actualizar la vista de inscripciones con el formulario de alta.
13. Escribir tests unitarios para `CreateEnrollmentUseCase`: socio inexistente, deporte inexistente, deporte eliminado, socio no activo, inscripción duplicada activa, cupo completo y creación exitosa.
14. Escribir tests de integración para el endpoint `POST /api/v1/enrollments`.
