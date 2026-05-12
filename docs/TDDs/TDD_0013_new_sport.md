---
id: 13
estado: Propuesto
autor: Maximo Carpignano
fecha: 2026-04-30
titulo: Registro de Nuevos Deportes
---

# TDD-0013: Registro de Nuevos Deportes

## Contexto de Negocio (PRD)

### Objetivo

Permitir a los administrativos registrar un nuevo deporte en el sistema de forma digital, asegurando que cada disciplina ofrecida por el club quede correctamente catalogada con su capacidad máxima, precio adicional y requisitos médicos desde el momento de su creación.

### User Persona

- **Nombre**: Alberto (Tesorero/Administrativo).
- **Necesidad**: Dar de alta un nuevo deporte rápidamente para que los socios puedan inscribirse. No puede permitirse registrar un deporte con capacidad cero o negativa, ya que eso generaría inscripciones inválidas. Además, el nombre del deporte debe ser definitivo al momento de cargarlo, ya que es el identificador natural del mismo.

### Criterios de Aceptación

- El sistema debe validar que `name` sea único (no puede existir otro deporte con el mismo nombre).
- El sistema debe validar que `max_capacity` sea un número entero estrictamente mayor a cero.
- El sistema debe validar que `name` no esté vacío.
- El sistema debe validar que `additional_price` sea mayor o igual a cero.
- El sistema debe validar que `requires_medical_certificate` sea un valor booleano.
- El deporte debe quedar guardado con su `id` generado automáticamente.
- El deporte se crea con `deleted_at` en `null`, indicando que está activo (no eliminado lógicamente).
- Al finalizar, el sistema debe mostrar un mensaje de éxito y limpiar el formulario.
- El deporte debe quedar guardado con todos sus campos correctamente persistidos.

---

## Diseño Técnico (RFC)

### Modelo de Datos

Se definirá la entidad `Sport` con las siguientes propiedades y restricciones:

- `id`: Identificador único universal (UUID).
- `name`: Cadena de texto, único e indexado (UK). **Inmutable post-creación**.
- `description`: Cadena de texto, opcional.
- `max_capacity`: Entero, debe ser estrictamente mayor a cero.
- `additional_price`: Número de punto flotante, representa el costo adicional de inscripción.
- `requires_medical_certificate`: Booleano, indica si el deporte requiere certificado médico vigente para inscribirse.
- `deleted_at`: DateTime, Marca de baja lógica. `null` indica que el deporte está activo; si tiene valor, indica que fue eliminado lógicamente (soft delete).

### Contrato de API (@alentapp/shared)

Definiremos los tipos en el paquete compartido para asegurar sincronización entre backend y frontend:

- **Endpoint**: `POST /api/v1/sports`
- **Request Body** (`CreateSportRequest`):

```ts
export interface SportDTO {
    id: string; //UUID
    name: string; //Nombre único del deporte
    description?: string; //Descripción del deporte
    max_capacity: number; //Cupo máximo, debe ser > 0
    additional_price: number; //Precio adicional debe ser >= 0
    requires_medical_certificate: boolean; //Indica si requiere certificado médico
    deleted_at: string | null; //ISO DateTime String. null = activo; con valor = eliminado lógicamente
}

export interface CreateSportRequest {
    name: string;
    description?: string;
    max_capacity: number;
    additional_price: number;
    requires_medical_certificate: boolean;
}
```

- **Response exitosa** (`201 Created`):

```ts
{
    data: SportDTO;
}
```

### Componentes de Arquitectura Hexagonal

- **Domain**: el puerto `SportRepository` define el contrato de persistencia. El servicio `SportValidator` (o una entidad `Sport`) concentra las reglas de negocio: `name` obligatorio y único (coordinado con el repositorio para la unicidad), `max_capacity` entero mayor a cero, `additional_price` mayor o igual a cero. Al crear un deporte, `deleted_at` se inicializa en `null`. El puerto se define completo desde el inicio para que los casos de uso de alta, modificación, baja y consulta compartan la misma interfaz.

- **Application**: `NewSportUseCase` orquesta el flujo sin conocer HTTP ni la base de datos: aplica validaciones, verifica duplicados por `name` y delega la persistencia al repositorio.

- **Infrastructure**: `PostgresSportRepository` implementa el puerto con Prisma, persiste el alta, mapea el resultado a `SportDTO` y captura errores de unicidad sobre `name`, traduciéndolos a errores de dominio comprensibles.

- **Delivery**: `SportController` expone `POST /api/v1/sports`, valida el body tipado como `CreateSportRequest`, delega al caso de uso y devuelve `201 Created` con `{ data: SportDTO }`. La ruta y las dependencias se registran en `app.ts`.

---

## Casos de Borde y Errores

| Escenario                   | Resultado Esperado                                   | Código HTTP               |
| --------------------------- | ---------------------------------------------------- | ------------------------- |
| `name` ya registrado        | Mensaje: "Ya existe un deporte con ese nombre"       | 409 Conflict              |
| `max_capacity` igual a cero | Mensaje: "La capacidad máxima debe ser mayor a cero" | 400 Bad Request           |
| `max_capacity` negativo     | Mensaje: "La capacidad máxima debe ser mayor a cero" | 400 Bad Request           |
| `name` vacío o ausente      | Mensaje: "El nombre del deporte es obligatorio"      | 400 Bad Request           |
| Error de conexión a DB      | Mensaje: "Error interno, reintente más tarde"        | 500 Internal Server Error |

## Plan de Implementación

1. Agregar `SportDTO` y `CreateSportRequest` al paquete `@alentapp/shared` (`packages/shared/index.ts`).
2. Modificar el esquema de persistencia (`schema.prisma`): agregar el modelo `Sport`, incluyendo `deleted_at` como campo nullable para soportar baja lógica.
3. Ejecutar la migración de base de datos con el nombre `create_sports_table`.
4. Crear el puerto `SportRepository.ts` en `src/domain/` con los métodos necesarios para el ciclo de vida de `Sport`: `create`, `findById`, `findByName`, `findAll`, `update` y `softDelete`.
5. Crear el servicio de dominio `SportValidator.ts` en `src/domain/services/`, encapsulando las reglas: `name` obligatorio y único, `max_capacity` > 0, `additional_price` >= 0.
6. Implementar `NewSportUseCase.ts` en `src/application/`.
7. Implementar `PostgresSportRepository.ts` en `src/infrastructure/`, con método `create` y mapeo a `SportDTO`.
8. Crear `SportController.ts` en `src/delivery/` con el método `create` y mapeo de errores.
9. Registrar las dependencias y la ruta `POST /api/v1/sports` en `src/app.ts`.
10. Agregar el método `create` al servicio frontend.
11. Crear o actualizar la vista de deportes con el formulario de alta.
12. Escribir tests unitarios para el caso de uso.
13. Escribir tests de integración para el endpoint `POST /api/v1/sports`.
