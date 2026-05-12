---
id: 0008
estado: Propuesto
autor: Pedro
fecha: 2026-04-30
titulo: Modificar Disciplina
---

# TDD-0008: Modificar Disciplina

## Contexto de Negocio (PRD)

### Objetivo

Permitir que un administrativo corrija o actualice los datos de una disciplina ya registrada, manteniendo la validez temporal del período de sanción en todo momento.

### User Persona

- **Nombre**: Alberto (Tesorero/Administrativo).
- **Necesidad**: Corregir errores en disciplinas ya cargadas, como un motivo mal redactado o fechas incorrectas. Necesita que el sistema siga validando la coherencia de fechas incluso al modificar, para no generar registros inválidos.

### Criterios de Aceptación

- El sistema debe validar que la disciplina a modificar exista. Si no existe, debe retornar un error claro.
- Si se modifican las fechas, el sistema debe volver a validar que `end_date` sea estrictamente posterior a `start_date`.
- Los campos no enviados en el body deben conservar su valor original.
- Al finalizar con éxito, el sistema debe retornar la disciplina con los datos actualizados.

---

## Diseño Técnico (RFC)

### Modelo de Datos

No se requieren cambios en el schema de Prisma. La entidad `Discipline` ya fue definida en TDD-0007.

### Contrato de API (@alentapp/shared)

- **Endpoint**: `PUT /api/v1/disciplines/:id`
- **Request Body** (`UpdateDisciplineRequest`):

```ts
{
    reason?: string;
    start_date?: string; // ISO 8601
    end_date?: string;   // ISO 8601
    is_total_suspension?: boolean;
}
```

- **Response** (`DisciplineResponse`):

```ts
{
    id: string;
    reason: string;
    start_date: string;
    end_date: string;
    is_total_suspension: boolean;
    member_id: string;
}
```

### Componentes de Arquitectura Hexagonal

- **Domain**:
  - Puerto `DisciplineRepository` (interface) — se extiende con método `update`.
  - `DisciplineValidator`: reutilizado del TDD-0007, valida `end_date > start_date` sobre los valores fusionados (originales + nuevos).

- **Application**:
  - `UpdateDisciplineUseCase`: busca la disciplina existente via `DisciplineRepository.findById`, fusiona los campos nuevos con los originales, invoca `DisciplineValidator` si se modifican fechas, y persiste via `DisciplineRepository.update`.

- **Infrastructure**:
  - `PostgresDisciplineRepository`: se extiende con la implementación del método `update` usando Prisma.
  - `DisciplineController`: registra la ruta `PUT /api/v1/disciplines/:id` en Fastify y delega al caso de uso.

---

## Casos de Borde y Errores

| Escenario | Resultado Esperado | Código HTTP |
|---|---|---|
| `id` de disciplina no encontrado | Error: "Disciplina no encontrada" | 404 Not Found |
| `end_date` actualizada igual a `start_date` | Error: "La fecha de fin debe ser posterior a la de inicio" | 400 Bad Request |
| `end_date` actualizada anterior a `start_date` | Error: "La fecha de fin debe ser posterior a la de inicio" | 400 Bad Request |
| Body vacío (sin campos) | Se retorna la disciplina sin cambios | 200 OK |
| Error de conexión a la base de datos | Error: "Error interno, reintente más tarde" | 500 Internal Server Error |

---

## Plan de Implementación

1. Definir `UpdateDisciplineRequest` en `@alentapp/shared`.
2. Extender puerto `DisciplineRepository` con método `update`.
3. Implementar `UpdateDisciplineUseCase` en Aplicación.
4. Extender `PostgresDisciplineRepository` con método `update`.
5. Implementar ruta `PUT` en `DisciplineController`.
