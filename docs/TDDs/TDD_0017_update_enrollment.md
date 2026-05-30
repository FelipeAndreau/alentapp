---
id: 17
estado: Propuesto
autor: Maximiliano
fecha: 2026-05-10
titulo: Modificación de Inscripción
---

# TDD-0017: Modificación de Inscripción

## Contexto de Negocio (PRD)

### Objetivo

Permitir que un administrativo modifique el estado de vigencia de una inscripción ya registrada, manteniendo la integridad del registro y respetando las restricciones del dominio en todo momento.

### User Persona

- **Nombre**: Ricardo Zielinski (Administrativo del Club).
- **Necesidad**: Actualizar el estado de una inscripcion existente, para desactivarla sin eliminarla del sistema. Necesita que el sistema valide que la inscripcin exista, este activa y no haya sido dada de baja lógicamente antes de permitir cualquier modificación.

### Criterios de Aceptación

- El sistema debe validar que la inscripcion a modificar exista.
- El sistema debe validar que la inscripcion no haya sido eliminada lógicamente (`deleted_at` debe ser `null`).
- El único campo modificable es `is_active`. Los campos `member_id`, `sport_id`, `enrollment_date` y `deleted_at` no pueden alterarse mediante este endpoint.
- Si no se envia ningún campo en el body, el sistema debe retornar la inscripcion sin cambios con `200 OK`.
- Si is_active pasa de false a true, el sistema debe:
    - validar que el socio exista (no haya sido eliminado logicamente) y tenga estado de cuenta activo;
    - validar que el deporte exista y no esté eliminado logicamente;
    - validar que no exista otra inscripcion activa para el mismo `member_id` y `sport_id`;
    - validar que el cupo del deporte no esté completo.
- Si is_active pasa de true a false, el sistema debe desactivar la inscripcion sin ejecutar validaciones adicionales de cupo, duplicados, socio o deporte.
- Al finalizar correctamente, el sistema debe responder con estado `200 OK` y retornar la inscripcion con el nuevo estado correspondiente.

---

## Diseño Técnico (RFC)

---

## Contrato de API (`@alentapp/shared`)

Se define el siguiente tipo adicional en el paquete compartido.

Se reutiliza `EnrollmentDTO`, definido en el TDD de alta de inscripcion.

- **Endpoint**: `PATCH /api/v1/enrollments/:id`

- **Request Body** (`UpdateEnrollmentRequest`):

```ts
export interface UpdateEnrollmentRequest {
    is_active?: boolean;
}
```

- **Response exitosa** (`200 OK`):

```ts
{
    data: EnrollmentDTO;
}
```

---

## Componentes de Arquitectura Hexagonal

- **Puerto**: `EnrollmentRepository` (interfaz en el Dominio) — se extiende con el método `update(id, data)` y `findById(id)`. Aplica reglas de negocio: no permitir modificar campos inmutables, validar estado de la inscripcion y validar condiciones para reactivacion (`false` a `true`).

- **Caso de Uso**: `UpdateEnrollmentUseCase` — orquesta el flujo sin conocer HTTP ni la base de datos. Busca la inscripción vía `EnrollmentRepository.findById`, valida que no esté eliminada lógicamente, fusiona los campos nuevos con los originales y persiste el cambio vía `EnrollmentRepository.update`.

- **Adaptador de Salida**: `PostgresEnrollmentRepository` — se extiende con la implementación del método `update` usando Prisma, operando únicamente sobre el campo `is_active`. Mapea el resultado a `EnrollmentDTO`.

- **Adaptador de Entrada**: `EnrollmentController` — registra la ruta `PATCH /api/v1/enrollments/:id` en Fastify, valida el body tipado como `UpdateEnrollmentRequest`, delega al caso de uso y devuelve `200 OK` con `{ data: EnrollmentDTO }`. Mapea las excepciones de dominio a los códigos HTTP correspondientes.

---

## Casos de Borde y Errores

| Escenario                                                     | Resultado Esperado                                            | Código HTTP               |
| ------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------- |
| `id` de inscripción no encontrado                             | Mensaje: "Inscripción no encontrada"                          | 404 Not Found             |
| `id` con formato inválido (no UUID)                           | Mensaje: "Identificador con formato inválido"                 | 400 Bad Request           |
| Inscripción eliminada lógicamente                             | Mensaje: "No se puede modificar una inscripción dada de baja" | 409 Conflict              |
| Body vacío (sin campos)                                       | Se retorna la inscripción sin cambios                         | 200 OK                    |
| Body con campos no permitidos (`member_id`, `sport_id`, etc.) | Mensaje: "El body contiene campos no permitidos"              | 400 Bad Request           |
| Error de conexión a la base de datos                          | Mensaje: "Error interno, reintente más tarde"                 | 500 Internal Server Error |

---

## Plan de Implementación

1. Agregar `UpdateEnrollmentRequest` al paquete `@alentapp/shared` (`packages/shared/index.ts`).
2. Extender el puerto `EnrollmentRepository.ts` en `src/domain/` con el método `update(id, data)`.
3. Implementar `UpdateEnrollmentUseCase.ts` en `src/application/`, fusionando los campos recibidos con los originales y delegando la persistencia al repositorio.
4. Extender `PostgresEnrollmentRepository.ts` en `src/infrastructure/` con la implementación del método `update`, operando únicamente sobre `is_active`.
5. Registrar la ruta `PATCH /api/v1/enrollments/:id` en `EnrollmentController.ts` en `src/delivery/` con el método de actualización y mapeo de errores.
6. Actualizar las dependencias y la ruta en `src/app.ts`.
7. Escribir tests unitarios para `UpdateEnrollmentUseCase`: inscripción inexistente, inscripción eliminada lógicamente, body vacío y actualización exitosa.
8. Escribir tests de integración para el endpoint `PATCH /api/v1/enrollments/:id`.
