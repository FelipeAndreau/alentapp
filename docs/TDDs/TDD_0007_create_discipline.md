---
id: 0007
estado: Propuesto
autor: Pedro
fecha: 2026-04-30
titulo: Crear Disciplina
---

# TDD-0007: Crear Disciplina

## Contexto de Negocio (PRD)

### Objetivo

Permitir que un administrativo registre una nueva disciplina (sanción) aplicada a un socio del club, garantizando que el período de sanción sea temporalmente válido y que el socio referenciado exista en el sistema.

### User Persona

- **Nombre**: Alberto (Tesorero/Administrativo).
- **Necesidad**: Registrar sanciones a socios de forma digital y rápida. Necesita que el sistema le impida cargar un período incoherente (fecha de fin anterior o igual a la de inicio), ya que un error así podría generar conflictos administrativos con el socio afectado.

### Criterios de Aceptación

- El sistema debe validar que `end_date` sea estrictamente posterior a `start_date`. Si no se cumple, debe rechazar la operación con un error claro.
- El sistema debe verificar que el `member_id` referenciado exista. Si no existe, debe rechazar la operación.
- Al finalizar con éxito, el sistema debe retornar la disciplina creada con su `id` generado.

---

## Diseño Técnico (RFC)

### Modelo de Datos

Se define la entidad `Discipline` en `packages/api/prisma/schema.prisma`:

- `id`: String, UUID generado automáticamente.
- `reason`: String, motivo de la disciplina. Requerido.
- `start_date`: DateTime, fecha de inicio de la sanción. Requerido.
- `end_date`: DateTime, fecha de fin de la sanción. Requerido. Debe ser estrictamente posterior a `start_date`.
- `is_total_suspension`: Boolean, indica si implica suspensión total. Default `false`.
- `member_id`: String, clave foránea que referencia a `Member`.

```prisma
model Discipline {
    id                  String   @id @default(uuid())
    reason              String
    start_date          DateTime
    end_date            DateTime
    is_total_suspension Boolean  @default(false)
    member_id           String
    member              Member   @relation(fields: [member_id], references: [id])

    @@map("disciplines")
}
```

> También se debe agregar la relación inversa en el modelo `Member`:
> ```prisma
> disciplines Discipline[]
> ```

La migración se genera con:
```bash
cd packages/api
npx prisma migrate dev --name create_disciplines_table
```

### Contrato de API (@alentapp/shared)

- **Endpoint**: `POST /api/v1/disciplines`
- **Request Body** (`CreateDisciplineRequest`):

```ts
{
    reason: string;
    start_date: string; // ISO 8601
    end_date: string;   // ISO 8601
    is_total_suspension: boolean;
    member_id: string;
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
  - Entidad `Discipline` con sus campos y tipos.
  - Puerto `DisciplineRepository` (interface) con método `create`.
  - `DisciplineValidator`: servicio de dominio que encapsula la regla `end_date > start_date`.

- **Application**:
  - `CreateDisciplineUseCase`: invoca `DisciplineValidator`, verifica existencia del `member_id` via `MemberRepository`, y persiste via `DisciplineRepository.create`.

- **Infrastructure**:
  - `PostgresDisciplineRepository`: implementación de `DisciplineRepository` usando Prisma.
  - `DisciplineController`: registra la ruta `POST /api/v1/disciplines` en Fastify y delega al caso de uso.

---

## Casos de Borde y Errores

| Escenario | Resultado Esperado | Código HTTP |
|---|---|---|
| `end_date` igual a `start_date` | Error: "La fecha de fin debe ser posterior a la de inicio" | 400 Bad Request |
| `end_date` anterior a `start_date` | Error: "La fecha de fin debe ser posterior a la de inicio" | 400 Bad Request |
| `member_id` no existe | Error: "No existe un socio con ese ID" | 404 Not Found |
| Campos requeridos ausentes en el body | Error de validación de schema | 400 Bad Request |
| Error de conexión a la base de datos | Error: "Error interno, reintente más tarde" | 500 Internal Server Error |

---

## Plan de Implementación

1. Agregar modelo `Discipline` en `schema.prisma` y relación inversa en `Member`.
2. Ejecutar `npx prisma migrate dev --name create_disciplines_table`.
3. Definir `CreateDisciplineRequest` y `DisciplineResponse` en `@alentapp/shared`.
4. Crear puerto `DisciplineRepository` en el Dominio.
5. Implementar `DisciplineValidator` en el Dominio.
6. Implementar `CreateDisciplineUseCase` en Aplicación.
7. Implementar `PostgresDisciplineRepository` en Infraestructura.
8. Implementar ruta `POST` en `DisciplineController`.
