# Acta del Equipo: Alentapp

## 1. Misión y Visión

- **Misión:** Digitalizar y modernizar la gestión de un club deportivo, reemplazando procesos manuales en papel por un sistema web confiable, eficiente y fácil de usar para los administrativos.
- **Visión:** Lograr una aplicación robusta y bien documentada que sirva como base escalable para la gestión integral de socios, actividades y recursos del club.

## 2. Miembros del Equipo y Roles

| Miembro                  | Rol                |
| :----------------------- | :----------------- |
| @FelipeAndreau           | Coordinador        |
| @MaxiC55                 | Miembro del equipo |
| @fiuzapedropcs12-netizen | Miembro del equipo |
| @JesusVergara04          | Miembro del equipo |

## 3. Objetivos del Proyecto (OKRs/SMART)

- **Objetivo:** Resolver todas las actividades del TP Integrador 2026 satisfaciendo los criterios de aprobación establecidos por la cátedra, aplicando buenas prácticas de ingeniería de software como el uso de feature branches, commits atómicos y revisión de código entre pares, entregando cada instancia dentro de los plazos definidos.

## 4. Normas y Acuerdos del Equipo

- **Comunicación:** WhatsApp para coordinación diaria y consultas rápidas entre integrantes.
- **Gestión del Tiempo:** Cada integrante es responsable de cumplir con sus tareas antes de la fecha límite establecida por la cátedra.
- **Resolución de Conflictos:** Discusión abierta entre los integrantes; en caso de no llegar a un acuerdo, el coordinador (@FelipeAndreau) toma la decisión final.

## 5. Flujo de Trabajo en GitHub (Feature Branch Workflow)

- **Rama `main`:** Solo código estable y revisado. Ningún integrante pushea directamente a esta rama.
- **Ramas de características (`feature/`):** Se crea una rama por tarea o entidad (ej: `feature/tdd-sport`).
- **Pull Requests (PRs):** Se requiere la revisión y aprobación de al menos 1 integrante antes de mergear.
- **Commits:** Deben seguir la convención: `tipo(scope): descripción corta en tiempo presente`.

### Convención de Commits

| Tipo       | Uso                                                |
| :--------- | :------------------------------------------------- |
| `feat`     | Nueva funcionalidad                                |
| `fix`      | Corrección de un error                             |
| `docs`     | Cambios en documentación                           |
| `style`    | Formato, espaciado (sin cambios de lógica)         |
| `refactor` | Cambio de código que no corrige ni agrega features |
| `test`     | Añadir o corregir pruebas                          |
| `chore`    | Mantenimiento, actualización de dependencias       |

## 6. Herramientas y Comunicación

- **Repositorio:** [https://github.com/FelipeAndreau/alentapp](https://github.com/FelipeAndreau/alentapp)
- **Gestión de Tareas:** [GitHub Projects]
- **Chat:** WhatsApp/Discord
- **Dudas técnicas:** [GitHub Discussions de la cátedra](https://github.com/orgs/frlp-utn-ingsoft/discussions/categories/q-a)

## 7. Acuerdos de "Definition of Done" (DoD)

Una tarea se considera terminada cuando:

1. [ ] El TDD o código fue redactado siguiendo el template y estándares de la cátedra.
2. [ ] El PR fue revisado y aprobado por al menos un integrante del equipo.
3. [ ] La rama fue mergeada a `main` sin conflictos.
4. [ ] La funcionalidad o documento está correctamente commiteado desde la terminal (no desde la interfaz de GitHub).
5. [ ] El `CHANGELOG.md` fue actualizado con la entrada correspondiente.
