---
id: 14
estado: Propuesto
autor: Maximo Carpignano
fecha: 2026-04-30
titulo: Actualización de Deportes Existentes
---

# TDD-0014: Actualización de Deportes Existentes

## Contexto de Negocio (PRD)

### Objetivo

Permitir a los administrativos modificar la información de un deporte existente, específicamente su descripción y capacidad máxima. El nombre del deporte es un identificador natural del sistema y no puede ser modificado una vez creado, garantizando la integridad de los datos históricos y las inscripciones vigentes.

### User Persona

- **Nombre**: Alberto (Tesorero/Administrativo).
- **Necesidad**: Actualizar el cupo de un deporte cuando el club habilita más espacio, o corregir la descripción de una actividad. No debe poder cambiar el nombre del deporte ya que podría generar inconsistencias con los registros de inscripción existentes.

### Criterios de Aceptación

- El sistema debe permitir actualizar únicamente `description` y `max_capacity`.
- El sistema **no debe exponer** el campo `name` como editable en ninguna parte del flujo (ni en el frontend ni en el backend).
- El sistema debe validar que `max_capacity` sea estrictamente mayor a cero si se envía en la solicitud.
- El sistema debe validar que el deporte esté activo (`deleted_at` en `null`) antes de permitir su modificación.
- Si la edición es correcta, debe retornar los datos actualizados del deporte.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

Solo los campos editables se incluyen en el cuerpo de la petición. `name` está explícitamente excluido del tipo de request para reforzar la inmutabilidad a nivel de contrato.
Ademas se utilizara el paquete compartido para definir el cuerpo de la petición. Todos los campos permitidos son opcionales porque se trata de una actualización parcial.
Se reutiliza `SportDTO`, definido en el TDD de new deporte, como contrato de respuesta común para la entidad.

- **Endpoint**: `PATCH /api/v1/sports/:id`
- **Request Body** (`UpdateSportRequest`)

```ts
export interface UpdateSportRequest {
    description?: string;
    max_capacity?: number;
}
```

- Response Body (SportDTO dentro de `{ data }`): `200: OK`:

```ts
{
    data: SportDTO;
}
```

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `SportRepository` (Interfaz en el Dominio con métodos `findById(id)` y `update(id, data)`). Permite que el caso de uso trabaje contra una abstracción y no dependa directamente de Prisma.
2. **Servicio de Dominio / Entidad**: `Sport` o `SportValidator` (Encargado de aplicar las reglas de negocio propias de la entidad). En esta operación debe garantizar que `name` no pueda modificarse después de la creación, que `max_capacity` sea mayor a cero , que `additional_price` no sea negativo y que no se modifiquen deportes eliminados lógicamente.
3. **Caso de Uso**: `UpdateSportUseCase` (Orquesta la operación). Recibe el `id` y el body del request, verifica que el deporte exista y que esté activo (`deleted_at` en `null`), valida los campos enviados, rechaza cualquier intento de modificar `name` y llama al repositorio para persistir los cambios.
4. **Adaptador de Salida**: `PostgresSportRepository` (Implementación real en BD usando Prisma). Ejecuta la actualización sobre la tabla `Sport` y expone los métodos definidos por el puerto.
5. **Adaptador de Entrada**: `SportController` (Ruta HTTP `PATCH /api/v1/sports/:id`). Extrae el `id` de la URL, valida el body tipado como `UpdateSportRequest`, invoca el caso de uso y mapea excepciones a códigos HTTP.

## Casos de Borde y Errores

| Escenario                       | Resultado Esperado                                       | Código HTTP actual        |
| ------------------------------- | -------------------------------------------------------- | ------------------------- |
| Deporte inexistente             | Mensaje: "El deporte no existe"                          | 404 Not Found             |
| Deporte eliminado lógicamente   | Mensaje: "No se puede modificar un deporte eliminado"    | 409 Conflict              |
| `max_capacity` igual a cero     | Mensaje: "La capacidad máxima debe ser mayor a cero"     | 400 Bad Request           |
| `max_capacity` negativo         | Mensaje: "La capacidad máxima debe ser mayor a cero"     | 400 Bad Request           |
| Body vacío (sin campos válidos) | No se realiza ningún cambio, se retorna el estado actual | 200 OK                    |
| Error de conexión a DB          | Mensaje: "Error interno, reintente más tarde"            | 500 Internal Server Error |

## Plan de Implementación

1. Crear el tipo `UpdateSportRequest` en `@alentapp/shared`, incluyendo únicamente los campos editables: `description`, `max_capacity`, `additional_price` y `requires_medical_certificate`.
2. Agregar el método `update(id, data)` al puerto `SportRepository` y asegurar que exista un método `findById(id)` para validar la existencia del deporte y su estado de baja lógica.
3. Implementar las validaciones de dominio para impedir la modificación de `name`, validar que `max_capacity` sea mayor a cero, que `additional_price` sea mayor o igual a cero y que no se modifiquen deportes eliminados lógicamente.
4. Implementar `UpdateSportUseCase`, verificando existencia del deporte, que esté activo (`deleted_at` en `null`), body no vacío, campos permitidos y reglas de negocio antes de persistir.
5. Implementar el método `update` en `PostgresSportRepository` usando Prisma.
6. Implementar el endpoint `PATCH /api/v1/sports/:id` en `SportController` y registrarlo en Fastify.
7. Crear o reutilizar el formulario/modal de edición en React, deshabilitando o excluyendo el campo `name`.
8. Escribir tests unitarios para el caso de uso: deporte inexistente, deporte eliminado, intento de modificar `name`, `max_capacity` inválido, `additional_price` inválido, body vacío y actualización exitosa.
9. Escribir tests de integración para el endpoint.
