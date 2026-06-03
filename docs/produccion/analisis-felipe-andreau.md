# Fase 1: Análisis de Problemas y Fundamentos de Observabilidad

## Integrante
- **Usuario:** Felipe Andreau

---

## Parte A: 5 Problemas Reales de Docker en el Entorno de Desarrollo

Durante el desarrollo del proyecto Alentapp, identificamos los siguientes problemas reales relacionados con Docker:

### 1. Imágenes de Producción Excesivamente Grandes
**Problema:** Las primeras versiones del Dockerfile de la API copiaban todo el monorepo y ejecutaban `npm install` sin separar dependencias de desarrollo. Esto resultaba en imágenes de más de 2GB que contenían herramientas de build innecesarias en producción (TypeScript compiler, Husky, ESLint, etc.).

**Impacto:** Transferencias lentas entre CI/CD y el registry, mayor superficie de ataque, consumo excesivo de disco en los nodos del cluster.

**Solución aplicada:** Implementar un build multi-stage con 3 etapas (`deps` → `build` → `runtime`), instalando solo dependencias de producción en la etapa final y compilando TypeScript a JavaScript para eliminar fuentes y devDependencies.

---

### 2. Ejecución como Root en Contenedores
**Problema:** Los contenedores iniciales ejecutaban el proceso Node.js como `root` (UID 0). Esto significa que si un atacante explota una vulnerabilidad en la aplicación, obtiene privilegios de root dentro del contenedor y potencialmente en el host.

**Impacto:** Violación del principio de mínimo privilegio. Un container escape con usuario root es crítico; con usuario no-privilegiado es limitado.

**Solución aplicada:** Utilizar la imagen oficial `node:22-alpine` que incluye el usuario `node` (UID 1000), y configurar `USER node` en la etapa final del Dockerfile. Adicionalmente, se aplicaron `cap_drop: ALL` y `cap_add: NET_BIND_SERVICE` en docker-compose.

---

### 3. Falta de Límites de Recursos (Resource Limits)
**Problema:** Sin límites de CPU y memoria, un contenedor con memory leak o CPU spike podía agotar los recursos del host Docker, afectando a otros servicios en la misma máquina (contenedores compañeros o incluso procesos del host).

**Impacto:** Denegación de servicio local. En un entorno de desarrollo con múltiples proyectos, un contenedor descontrolado deja inestable toda la máquina.

**Solución aplicada:** Definir `deploy.resources.limits` y `reservations` para cada servicio en `docker-compose.prod.yml`. Ejemplo: API limitado a 0.5 CPU y 256MB de RAM.

---

### 4. Configuración de Red por Defecto Insegura
**Problema:** Usar la red bridge por defecto de Docker (`bridge`) expone todos los puertos entre contenedores sin aislamiento. Además, no permite resolución DNS por nombre de servicio de forma predecible.

**Impacto:** Servicios que no deberían comunicarse entre sí pueden hacerlo. Dificulta la aplicación de network policies y el debug de conectividad.

**Solución aplicada:** Crear una red bridge custom (`alentapp-prod-net`) con nombre explícito. Esto aísla el tráfico del stack de producción del resto del host y habilita DNS interno (`api`, `db`, `prometheus`).

---

### 5. Secrets y Variables Sensibles Hardcodeadas
**Problema:** En etapas tempranas del desarrollo, credenciales de base de datos y claves API aparecían directamente en `docker-compose.yml` o en el código fuente.

**Impacto:** Riesgo de filtración de credenciales por commits accidentales al repositorio. Dificulta rotar secretos y viola el principio de "configuración por entorno" (12-factor app).

**Solución aplicada:** Extraer todas las variables sensibles a un archivo `.env` ignorado por git (agregado a `.gitignore`). El `docker-compose.prod.yml` usa `env_file: - .env` y referencias de interpolación (`${VAR:-default}`), garantizando que los secretos nunca se versionen.

---

## Parte B: Fundamentos de Observabilidad

### ¿Qué es la Observabilidad?

La observabilidad es la capacidad de entender el estado interno de un sistema analizando sus salidas externas. Un sistema es observable si podemos inferir su comportamiento actual y pasado sin necesidad de agregar nuevos puntos de instrumentación cada vez que surge un problema.

Se fundamenta en **tres pilares**:

#### 1. Logs (Registros)
Son eventos discretos con timestamp que registran acciones específicas del sistema. Cada log es una historia puntual: "usuario X intentó login", "excepción Y en módulo Z". Son útiles para debugging post-mortem y auditoría.

#### 2. Métricas (Metrics)
Son datos numéricos agregados en el tiempo que describen el estado y rendimiento del sistema. Son eficientes para almacenar y visualizar. Ejemplos: "requests por segundo", "latencia p95", "uso de memoria". Permiten alertas y dashboards.

#### 3. Trazas (Traces / Distributed Traces)
Siguen el recorrido completo de una solicitud a través de múltiples servicios. Cada traza se compone de spans (unidades de trabajo). Son fundamentales en arquitecturas de microservicios para identificar dónde se produce latencia en una cadena de llamadas.

---

### OpenTelemetry (OTel)

OpenTelemetry es un proyecto CNCF (Cloud Native Computing Foundation) que estandariza la instrumentación, generación, colección y exportación de datos de telemetría (métricas, logs y trazas).

#### Arquitectura de OpenTelemetry

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Aplicación    │────▶│      SDK OTel    │────▶│    Exporter     │
│  (instrumentada)│     │  (Collector/Agent)│     │ (Prometheus,    │
│                 │     │                  │     │  OTLP, Jaeger)  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

**Componentes clave:**

- **API:** Define las interfaces para crear spans, métricas y logs.
- **SDK:** Implementa la API y proporciona configuración, procesamiento y exportación.
- **Collector:** Servicio opcional que recibe, procesa y reenvía telemetría (enrutamiento, sampling, enriquecimiento).
- **Exporter:** Plugin que envía datos a un backend (Prometheus, Grafana Tempo, Jaeger, etc.).

#### Instrumentación Manual vs. Automática

**Automática:** Agrega instrumentación sin modificar el código fuente. Por ejemplo, `auto-instrumentations-node` intercepta librerías HTTP, Express, Fastify, Prisma, etc., y genera métricas/trazas automáticamente. Ventaja: rápida de implementar. Desventaja: menos granularidad y control.

**Manual:** El desarrollador inserta explícitamente llamadas a la API de OTel en el código. Por ejemplo, incrementar un contador de requests, medir la duración de un handler específico, agregar atributos de negocio a un span. Ventaja: total control y métricas de dominio (negocio). Desventaja: requiere mantenimiento.

**En este proyecto usamos ambas:** auto-instrumentación para HTTP/Fastify + instrumentación manual en el `PaymentController` para métricas RED específicas.

---

### Métricas RED

RED es un patrón de métricas diseñado específicamente para monitorear servicios HTTP/APIs, propuesto por Tom Wilkie (Weaveworks). Es el estándar de facto para SRE.

| Letra | Métrica | Descripción | Tipo OTel |
|-------|---------|-------------|-----------|
| **R** | **Rate** | Número de requests por segundo. Indica la carga del servicio. | `Counter` (monotónico) |
| **E** | **Errors** | Porcentaje de requests que fallan (status ≥ 400). Indica salud. | `Counter` con atributo `status` |
| **D** | **Duration** | Tiempo que tarda cada request (latencia). Indica rendimiento. | `Histogram` o `Timer` |

**Ventajas de RED:**
- Son las únicas 3 métricas que realmente importan para una API REST.
- Se pueden agregar fácilmente a dashboards y alertas.
- Permiten calcular SLIs (Service Level Indicators) como "latencia p95 < 200ms" o "error rate < 1%".

**Implementación en Alentapp:**
- **Rate:** `http.requests.total` — counter que se incrementa en cada handler del PaymentController.
- **Errors:** `http.requests.errors` — counter que se incrementa solo cuando `statusCode >= 400`.
- **Duration:** `http.request.duration` — histogram que mide desde la entrada al handler hasta la respuesta, con buckets para p50/p95/p99.

Adicionalmente, se agregaron gauges para:
- `process.memory.usage` — uso de memoria del proceso Node.js.
- `http.requests.active` — requests concurrentes en vuelo.

---

## Conclusión

El análisis de problemas Docker nos llevó a aplicar hardening (no-root, read-only, cap_drop, resource limits) y el estudio de observabilidad justifica la adopción de OpenTelemetry con métricas RED para el módulo de pagos. La siguiente fase traduce estos requerimientos en un diseño técnico ejecutable.
