---
id: 18
estado: Propuesto
autor: Maximiliano
fecha: 2026-05-10
titulo: Baja de Inscripción
---

# TDD-0018: Baja de Inscripción

## Contexto de Negocio (PRD)

### Objetivo

Permitir que un administrativo dé de baja una inscripción existente, retirándola del circuito operativo del sistema sin eliminar su registro histórico en la base de datos.

La baja se implementa mediante **eliminación lógica**: se establece `deleted_at` con la fecha y hora actuales del servidor y se actualiza `is_active` a `false`. El registro permanece en la base de datos para fines de auditoría, trazabilidad y análisis histórico.

### User Persona

- **Nombre**: Guido Marcelo C. (Administrativo del Club).
- **Necesidad**: Dar de baja una inscripción que fue cargada por error o que dejó de ser operativa, sin perder el historial del vínculo entre el socio y el deporte.

### Criterios de Aceptación

- El sistema debe permitir dar de baja una inscripción identificada por su `id`.
- El sistema debe validar que la inscripción exista. Si no existe, debe retornar un error claro.
- El sistema debe validar que la inscripción no haya sido eliminada previamente (`deleted_at` debe ser `null`). Si ya fue dada de baja, debe retornar un error claro.
- Al realizar la baja, el sistema debe establecer `deleted_at` con la fecha y hora actuales del servidor y `is_active` en `false`.
- El registro no debe eliminarse físicamente de la base de datos.
- La inscripción dada de baja no debe aparecer en listados operativos ni ser considerada en validaciones de cupo o duplicados.
- Al finalizar correctamente, la API debe responder con estado `200 OK` y retornar el `EnrollmentDTO` actualizado con `deleted_at` poblado e `is_active = false`.

---

## Diseño Técnico (RFC)

### Nota de Diseño

> Una inscripción representa un hecho de negocio: un socio estuvo inscripto a un deporte en una fecha determinada. Por este motivo el registro no se elimina físicamente.
>
> Para efectos operativos —cupo, duplicados y listados— solo se consideran las inscripciones con `is_active = true` y `deleted_at = null`.

---

## Contrato de API (`@alentapp/shared`)

Se reutiliza `EnrollmentDTO` definido en TDD-0024. No se requieren nuevos tipos.

- **Endpoint**: `DELETE /api/v1/enrollments/:id`
- **Request Body**: `None`.

- **Response exitosa** (`200 OK`):

```ts
{
    data: EnrollmentDTO;
}
```

> Se retorna el DTO actualizado porque la operación modifica el recurso (`deleted_at` e `is_active`), a diferencia de un `204 No Content` que no devolvería información del estado final del registro.

---

## Componentes de Arquitectura Hexagonal

- **Puerto**: `EnrollmentRepository` (interfaz en el Dominio) — se extiende con el método `softDelete(id)`. Permite que el caso de uso opere contra una abstracción sin depender directamente de Prisma.

- **Servicio de Dominio**: `EnrollmentValidator` — reutilizado de TDD-0024. Para este caso de uso valida que la inscripción exista y que no haya sido eliminada previamente.

- **Caso de Uso**: `DeleteEnrollmentUseCase` — orquesta la operación de baja. Recibe el `id`, delega las validaciones al `EnrollmentValidator` y ejecuta la baja lógica vía `EnrollmentRepository.softDelete`.

- **Adaptador de Salida**: `PostgresEnrollmentRepository` — se extiende con la implementación del método `softDelete`, que actualiza `deleted_at` con la fecha y hora actuales del servidor y establece `is_active = false` usando Prisma. Mapea el resultado a `EnrollmentDTO`.

- **Adaptador de Entrada**: `EnrollmentController` — registra la ruta `DELETE /api/v1/enrollments/:id` en Fastify, valida el parámetro `id`, delega al caso de uso y devuelve `200 OK` con `{ data: EnrollmentDTO }`. Mapea las excepciones de dominio a los códigos HTTP correspondientes.

---

## Casos de Borde y Errores

| Escenario                                 | Resultado Esperado                                             | Código HTTP               |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------- |
| `id` no corresponde a ninguna inscripción | Mensaje: "Inscripción no encontrada"                           | 404 Not Found             |
| `id` con formato inválido (no UUID)       | Mensaje: "Identificador con formato inválido"                  | 400 Bad Request           |
| Inscripción ya dada de baja previamente   | Mensaje: "La inscripción ya fue dada de baja"                  | 409 Conflict              |
| Baja lógica exitosa                       | `EnrollmentDTO` con `deleted_at` poblado e `is_active = false` | 200 OK                    |
| Error de conexión a la base de datos      | Mensaje: "Error interno, reintente más tarde"                  | 500 Internal Server Error |

---

## Plan de Implementación

1. Confirmar que el modelo `Enrollment` en `schema.prisma` incluya `deleted_at` nullable e `is_active` (definidos en TDD-0024).
2. Confirmar que `EnrollmentDTO` incluya los campos `deleted_at` e `is_active` (definido en TDD-0024).
3. Extender el puerto `EnrollmentRepository.ts` en `src/domain/` con el método `softDelete(id)`.
4. Implementar `DeleteEnrollmentUseCase.ts` en `src/application/`, validando existencia y estado de la inscripción antes de ejecutar la baja.
5. Implementar el método `softDelete` en `PostgresEnrollmentRepository.ts` en `src/infrastructure/`: actualizar `deleted_at = now()` e `is_active = false`.
6. Registrar la ruta `DELETE /api/v1/enrollments/:id` en `EnrollmentController.ts` en `src/delivery/` con mapeo de errores.
7. Actualizar dependencias y ruta en `src/app.ts`.
8. Asegurar que los métodos `findAll` y `findActiveByMemberAndSport` del repositorio excluyan registros con `deleted_at != null`.
9. Escribir tests unitarios para `DeleteEnrollmentUseCase`: inscripción inexistente, inscripción ya eliminada y baja exitosa.
10. Escribir tests de integración para el endpoint `DELETE /api/v1/enrollments/:id`.
