---
id: 0012
estado: Propuesto
autor: Jesus Vergara
fecha: 2026-04-30
titulo: Eliminar Casillero
---

# TDD-0012: Eliminar Casillero

## Contexto de Negocio (PRD)

### Objetivo

Permitir que un administrativo elimine un casillero del sistema, siempre que no esté actualmente asignado a un socio, manteniendo la integridad de los datos del club.

### User Persona

- **Nombre**: Administrativo del club.
- **Necesidad**: Dar de baja casilleros que ya no están en uso o que fueron retirados físicamente del vestuario. Necesita que el sistema le impida eliminar un casillero ocupado, ya que podría dejar a un socio sin el servicio que está pagando.

### Criterios de Aceptación

- El sistema debe impedir la eliminación de un casillero que tenga un socio asignado (`member_id` distinto de `null`).
- Si el casillero no existe, el sistema debe retornar un error.
- Al finalizar con éxito, el sistema debe retornar un mensaje de confirmación.
- Los casilleros pueden ser eliminados libremente siempre que su member_id sea null, sin importar si su status es Available o Maintenance.

---

## Diseño Técnico (RFC)

### Modelo de Datos

Se elimina el registro de `Locker` correspondiente al `id` recibido, siempre que `member_id` sea `null`.

### Contrato de API (@alentapp/shared)

- **Endpoint**: `DELETE /api/v1/lockers/:id`
- **Request Body**: ninguno.
- **Response**:

```ts
{
    message: string;
}
```

### Componentes de Arquitectura Hexagonal

- **Domain**:
  - Entidad `Locker` con sus campos y tipos.
  - Puerto `LockerRepository` (interface) con método `delete`.
  - Regla de negocio: no se puede eliminar un casillero con `member_id` distinto de `null`.

- **Application**:
  - `DeleteLockerUseCase`: verifica existencia del casillero via `LockerRepository`, valida que no tenga socio asignado, y elimina via `LockerRepository.delete`.

- **Infrastructure**:
  - `PostgresLockerRepository`: implementación de `LockerRepository` usando Prisma.
  - `LockerController`: registra la ruta `DELETE /api/v1/lockers/:id` en Fastify y delega al caso de uso.

---

## Casos de Borde y Errores

| Escenario | Resultado Esperado | Código HTTP |
|---|---|---|
| Casillero con socio asignado | Error: "No se puede eliminar un casillero ocupado" | 409 Conflict |
| ID de casillero inexistente | Error: "No existe un casillero con ese ID" | 404 Not Found |
| Error de conexión a la base de datos | Error: "Error interno, reintente más tarde" | 500 Internal Server Error |

---

## Plan de Implementación

1. Definir tipos en `@alentapp/shared`.
2. Crear puerto `LockerRepository` en el Dominio con método `delete`.
3. Implementar la regla de negocio de validación antes de eliminar en el Dominio.
4. Implementar `DeleteLockerUseCase` en Aplicación.
5. Implementar método `delete` en `PostgresLockerRepository`.
6. Implementar ruta `DELETE` en `LockerController`.