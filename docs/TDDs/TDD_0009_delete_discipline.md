---
id: 0009
estado: Propuesto
autor: Pedro
fecha: 2026-04-30
titulo: Eliminar Disciplina
---

# TDD-0009: Eliminar Disciplina

## Contexto de Negocio (PRD)

### Objetivo

Permitir que un administrativo elimine una disciplina registrada por error o que ya no sea pertinente, manteniendo la integridad del sistema al verificar que el registro exista antes de intentar borrarlo.

### User Persona

- **Nombre**: Alberto (Tesorero/Administrativo).
- **Necesidad**: Eliminar disciplinas cargadas por error sin que el sistema falle silenciosamente. Necesita confirmación de que la operación se realizó o un mensaje claro si el registro no existe.

### Criterios de Aceptación

- El sistema debe verificar que la disciplina a eliminar exista. Si no existe, debe retornar un error claro.
- Al finalizar con éxito, el sistema debe confirmar que la disciplina fue eliminada.
- La eliminación es física (borrado real del registro en la base de datos).

---

## Diseño Técnico (RFC)

### Modelo de Datos

No se requieren cambios en el schema de Prisma. La entidad `Discipline` ya fue definida en TDD-0007.

### Contrato de API (@alentapp/shared)

- **Endpoint**: `DELETE /api/v1/disciplines/:id`
- **Request Body**: No aplica.
- **Response**: `204 No Content` (sin body)

### Componentes de Arquitectura Hexagonal

- **Domain**:
  - Puerto `DisciplineRepository` (interface) — se extiende con método `delete`.

- **Application**:
  - `DeleteDisciplineUseCase`: busca la disciplina via `DisciplineRepository.findById`, lanza error si no existe, y elimina via `DisciplineRepository.delete`.

- **Infrastructure**:
  - `PostgresDisciplineRepository`: se extiende con la implementación del método `delete` usando Prisma.
  - `DisciplineController`: registra la ruta `DELETE /api/v1/disciplines/:id` en Fastify y delega al caso de uso.

---

## Casos de Borde y Errores

| Escenario | Resultado Esperado | Código HTTP |
|---|---|---|
| `id` de disciplina no encontrado | Error: "Disciplina no encontrada" | 404 Not Found |
| `id` con formato inválido (no UUID) | Error de validación de parámetro | 400 Bad Request |
| Error de conexión a la base de datos | Error: "Error interno, reintente más tarde" | 500 Internal Server Error |

---

## Plan de Implementación

1. Extender puerto `DisciplineRepository` con método `delete`.
2. Implementar `DeleteDisciplineUseCase` en Aplicación.
3. Extender `PostgresDisciplineRepository` con método `delete`.
4. Implementar ruta `DELETE` en `DisciplineController`.
