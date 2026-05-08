---
id: 0011
estado: Propuesto
autor: Jesus Vergara
fecha: 2026-04-30
titulo: Actualizar Casillero
---

# TDD-0011: Actualizar Casillero

## Contexto de Negocio (PRD)

### Objetivo

Permitir que un administrativo modifique los datos de un casillero existente, incluyendo la asignación o liberación de un socio, respetando la restricción de que no se puede asignar un casillero en mantenimiento.

### User Persona

- **Nombre**: Administrativo del club.
- **Necesidad**: Asignar casilleros a socios, liberarlos cuando finaliza el contrato, o actualizar su ubicación y estado. Necesita que el sistema le impida asignar un casillero en mantenimiento, ya que podría generar inconvenientes operativos en el vestuario.

### Criterios de Aceptación

- El sistema debe impedir la asignación de un socio a un casillero cuyo `status` sea `Maintenance`. Si no se cumple, debe rechazar la operación con un error claro.
- Al asignar un socio, el `status` debe cambiar automáticamente a `Occupied`.
- Al liberar un casillero (`member_id` = null), el `status` debe volver a `Available`.
- Si el ID del casillero no existe, el sistema debe retornar un error.
- Si un casillero pasa a estado `Maintenance` y tiene un socio asignado, 
el sistema debe liberar automáticamente al socio (setear `member_id` a `null`).
- Si se provee un member_id, el sistema debe validar que el socio exista en la base de datos. Si no existe, debe rechazar la operación.
- Si el casillero pasa a estado Available o Maintenance, su member_id DEBE ser null. Si pasa a Occupied, DEBE tener un member_id válido. Combinaciones contradictorias deben ser rechazadas.

---

## Diseño Técnico (RFC)

### Modelo de Datos

Se actualiza el registro existente de `Locker`:

- `status`: String — puede cambiar entre `Available`, `Occupied`, `Maintenance`.
- `member_id`: String, UUID, FK, nullable — se asigna o se libera.

### Contrato de API (@alentapp/shared)

- **Endpoint**: `PUT /api/v1/lockers/:id`
- **Request Body** (`UpdateLockerRequest`):

```ts
{
    member_id?: string | null;
    status?: "Available" | "Occupied" | "Maintenance";
    location?: string;
}
```

- **Response** (`LockerResponse`):

```ts
{
    id: string;
    number: number;
    location: string;
    status: string;
    member_id: string | null;
}
```

### Componentes de Arquitectura Hexagonal

- **Domain**:
  - Entidad `Locker` con sus campos y tipos.
  - Puerto `LockerRepository` (interface) con método `update`.
  - Regla de negocio: no se puede asignar un socio a un casillero con `status` `Maintenance`.

- **Application**:
  - `UpdateLockerUseCase`: verifica existencia del casillero via `LockerRepository`, valida la regla de negocio sobre el `status`, y persiste via `LockerRepository.update`.

- **Infrastructure**:
  - `PostgresLockerRepository`: implementación de `LockerRepository` usando Prisma.
  - `LockerController`: registra la ruta `PUT /api/v1/lockers/:id` en Fastify y delega al caso de uso.

---

## Casos de Borde y Errores

| Escenario | Resultado Esperado | Código HTTP |
|---|---|---|
| Asignar socio a casillero en `Maintenance` | Error: "El casillero no está disponible para ser asignado" | 409 Conflict |
| ID de casillero inexistente | Error: "No existe un casillero con ese ID" | 404 Not Found |
| Campos inválidos en el body | Error de validación de schema | 400 Bad Request |
| Error de conexión a la base de datos | Error: "Error interno, reintente más tarde" | 500 Internal Server Error |
| Casillero `Occupied` pasa a `Maintenance` | Se libera el socio automáticamente y el casillero queda en `Maintenance` con `member_id` null | 200 OK |
| `member_id` provisto no existe en la DB | Error: "No existe un socio con ese ID" | 404 Not Found |
| Status `Occupied` sin `member_id` | Error: "Para asignar estado Occupied se requiere un member_id válido" | 400 Bad Request |
| Status `Available` o `Maintenance` con `member_id` no null | Error: "El member_id debe ser null para este estado" | 400 Bad Request |

---

## Plan de Implementación

1. Definir `UpdateLockerRequest` en `@alentapp/shared`.
2. Crear puerto `LockerRepository` en el Dominio con método `update`.
3. Implementar la regla de negocio de validación de `status` en el Dominio.
4. Implementar `UpdateLockerUseCase` en Aplicación.
5. Implementar método `update` en `PostgresLockerRepository`.
6. Implementar ruta `PUT` en `LockerController`.