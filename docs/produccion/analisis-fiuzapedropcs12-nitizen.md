# Fase 1: Análisis de Problemas y Fundamentos de Observabilidad

## Integrante
- **Usuario:** fiuzapedropcs12-nitizen

---

## Parte A: 5 Problemas Reales de Docker en el Entorno de Desarrollo

Durante el desarrollo del proyecto Alentapp, identifiqué los siguientes problemas en la configuración Docker existente (`packages/api/Dockerfile` y `docker-compose.yml`):

### 1. `npm install` en vez de `npm ci` — Builds no reproducibles

**Problema:** En `packages/api/Dockerfile`, la instrucción de instalación de dependencias usa `npm install`:

```dockerfile
RUN npm install && chown -R node:node /app
```

`npm install` puede actualizar versiones de paquetes dentro del rango semver definido en `package.json`, ignorando parcialmente el `package-lock.json`. Esto significa que dos builds ejecutadas en distintos momentos pueden producir imágenes con versiones de dependencias diferentes.

**Dónde ocurre:** `packages/api/Dockerfile` — línea `RUN npm install && chown -R node:node /app`

**Impacto:** Alto. Una dependencia que cambia de versión entre builds puede introducir un bug o vulnerabilidad de seguridad sin que el equipo lo perciba. En CI/CD, esto viola el principio de *reproducibilidad*.

**Solución propuesta:** Reemplazar por `npm ci`, que instala exactamente lo que especifica el `package-lock.json` y falla si hay discrepancias.

```dockerfile
RUN npm ci --ignore-scripts
```

---

### 2. Puerto 5432 de PostgreSQL expuesto directamente al host

**Problema:** En `docker-compose.yml`, el servicio de base de datos expone su puerto al host:

```yaml
db:
  ports:
    - '5432:5432'
```

Esto hace que PostgreSQL sea accesible desde cualquier proceso del sistema host (o red local si el firewall no está configurado), no solo desde la API dentro de la red Docker.

**Dónde ocurre:** `docker-compose.yml` — sección `db`, clave `ports`

**Impacto:** Alto. La base de datos contiene todos los datos de la aplicación. Exponer el puerto 5432 permite intentos de conexión directa con herramientas como `psql`, DBeaver o `pgAdmin` desde fuera del stack, aumentando la superficie de ataque.

**Solución propuesta:** Eliminar el mapeo de puertos del servicio `db`. La API puede alcanzar la base de datos por nombre de servicio (`db`) dentro de la red Docker sin necesidad de exponer el puerto al host.

```yaml
db:
  # ports: NO mapear al host en producción
  networks:
    - alentapp-net
```

---

### 3. Imagen de una sola etapa con devDependencies incluidas

**Problema:** El `Dockerfile` de la API usa una sola etapa (`FROM node:20-alpine`) y ejecuta `npm install` sin la flag `--omit=dev`. Esto instala tanto dependencias de producción como de desarrollo en la misma imagen que se usa para correr la aplicación.

```dockerfile
FROM node:20-alpine
# ...
RUN npm install && chown -R node:node /app
```

**Dónde ocurre:** `packages/api/Dockerfile` — imagen base única sin multi-stage build

**Impacto:** Alto. La imagen final contiene herramientas de desarrollo como TypeScript (`tsc`), ESLint, Husky, ts-node, vitest y sus dependencias. Esto significa:
- Imagen más grande (~1GB vs ~300MB con multi-stage)
- Mayor superficie de ataque: un atacante que acceda al contenedor dispone de más herramientas
- Violación del principio de mínimo privilegio

**Solución propuesta:** Implementar un multi-stage build con 3 etapas (`deps` → `build` → `runtime`). La etapa final solo copia el JavaScript compilado y las dependencias de producción.

---

### 4. Volumen de hot-reload `.:/app` con filesystem completamente writable

**Problema:** En `docker-compose.yml`, el servicio `api` monta el directorio raíz del proyecto dentro del contenedor:

```yaml
api:
  volumes:
    - .:/app
    - /app/node_modules
```

Este volumen sincroniza bidireccialmente el código fuente entre el host y el contenedor.

**Dónde ocurre:** `docker-compose.yml` — servicio `api`, primer volumen `- .:/app`

**Impacto:** Medio (alto en contexto productivo). El filesystem del contenedor es completamente writable y refleja el del host. Si un proceso dentro del contenedor fuera comprometido, podría modificar archivos del host. Además, montar todo el monorepo expone archivos sensibles que no son necesarios para ejecutar la API (`.git/`, `.env`, claves privadas, etc.).

**Solución propuesta:** En producción, no usar volúmenes de código. En desarrollo, montar solo los directorios necesarios con `read_only: true` donde sea posible.

---

### 5. `NODE_ENV` no configurado en el servicio API

**Problema:** En `docker-compose.yml`, el servicio `api` no define la variable de entorno `NODE_ENV`:

```yaml
api:
  environment:
    - DATABASE_URL=postgres://admin:password123@db:5432/alentapp_db
    - CHOKIDAR_USEPOLLING=true
    - WATCHPACK_POLLING=true
    # NODE_ENV no está definida
```

Sin esta variable, Node.js y Fastify no saben si están en modo desarrollo o producción.

**Dónde ocurre:** `docker-compose.yml` — servicio `api`, sección `environment`

**Impacto:** Medio. Sin `NODE_ENV=production`:
- Fastify no activa optimizaciones internas de rendimiento
- El motor V8 de Node.js no aplica ciertas optimizaciones JIT
- Algunas librerías (como morgan o pino) pueden activar logs verbosos que no corresponden a producción
- Middlewares pueden comportarse diferente al entorno de prod, generando falsos negativos en QA

**Solución propuesta:** Agregar `NODE_ENV=production` en el entorno del servicio API, tanto en `docker-compose.yml` (dev) como en `docker-compose.prod.yml`.

```yaml
api:
  environment:
    - NODE_ENV=production
```

---

## Parte B: Fundamentos de Observabilidad

### ¿Qué es OpenTelemetry y cómo se diferencia de Prometheus?

**OpenTelemetry (OTel)** es un proyecto de la CNCF (Cloud Native Computing Foundation) que define estándares y provee SDKs para instrumentar, generar, recolectar y exportar datos de telemetría (métricas, logs y trazas distribuidas) de forma vendor-neutral.

**Prometheus** es una herramienta de monitoreo y base de datos de series temporales, especializada exclusivamente en **métricas**. Usa un modelo **pull**: el servidor Prometheus hace scraping periódico de los endpoints `/metrics` de las aplicaciones.

| Aspecto | OpenTelemetry | Prometheus |
|---------|--------------|------------|
| Alcance | Métricas + Logs + Trazas | Solo métricas |
| Modelo | Push o Pull (configurable) | Pull (scraping) |
| Vendor | Vendor-neutral (CNCF) | Propio ecosistema |
| Destino | Múltiples backends | Base de datos propia (TSDB) |
| Rol en Alentapp | Instrumentación de la app | Almacenamiento y consulta |

OTel y Prometheus se complementan: OTel instrumenta la aplicación y puede exportar métricas en formato Prometheus, que luego Prometheus scrapea y almacena.

---

### Los 3 pilares de la observabilidad

Un sistema es observable cuando podemos entender su estado interno a partir de sus salidas externas. Los tres pilares son:

1. **Logs:** Eventos discretos con timestamp que registran acciones o errores específicos. Ejemplo: `"Usuario ID 42 intentó acceder a /admin - 403 Forbidden"`. Son útiles para debugging post-mortem y auditorías.

2. **Métricas:** Datos numéricos agregados en el tiempo que describen el estado del sistema. Ejemplo: `requests_per_second = 142`, `memory_used_mb = 89`. Son eficientes para almacenar, visualizar en dashboards y generar alertas.

3. **Trazas (Distributed Traces):** Siguen el recorrido completo de una solicitud a través de múltiples servicios. Cada traza se compone de **spans** (unidades de trabajo). Son fundamentales para identificar dónde se produce latencia en una cadena de llamadas.

**OpenTelemetry aborda los tres pilares** desde un único SDK, mientras que herramientas anteriores (Prometheus, Jaeger, ELK Stack) solo cubrían uno.

---

### Métricas RED (Rate, Errors, Duration)

El método RED fue propuesto por Tom Wilkie (Weaveworks) como el conjunto mínimo de métricas para monitorear servicios HTTP/APIs:

| Letra | Métrica | Qué mide | Para qué sirve | Tipo OTel |
|-------|---------|----------|----------------|-----------|
| **R** | **Rate** | Número de requests por segundo | Indica la carga actual del servicio — si sube bruscamente puede señalar un spike o un ataque | `Counter` |
| **E** | **Errors** | Porcentaje de requests que devuelven 4xx/5xx | Indica la salud del servicio — si supera el 1-5% hay que investigar | `Counter` con atributo `status` |
| **D** | **Duration** | Tiempo que tarda cada request (latencia) | Indica la experiencia del usuario — el p95 y p99 revelan el caso peor percibido | `Histogram` |

En Alentapp se implementó RED en el `DisciplineController`:
- **Rate:** `http.requests.total` — se incrementa en cada handler
- **Errors:** `http.requests.errors` — se incrementa cuando `status >= 400`
- **Duration:** `http.request.duration` — histogram que mide desde la entrada al handler hasta la respuesta

---

### ¿Qué es el OTLP (OpenTelemetry Protocol)?

OTLP es el protocolo nativo de OpenTelemetry para transmitir datos de telemetría. Funciona sobre **gRPC** (binario, eficiente) o **HTTP/protobuf**.

**Ventaja frente a exportar directamente a Prometheus:**

Con OTLP, la aplicación envía datos a un **OTel Collector** (intermediario) que puede reenviarlos simultáneamente a múltiples backends:

```
App (OTLP) → OTel Collector → Prometheus (métricas)
                            → Jaeger (trazas)
                            → Datadog (logs + métricas)
                            → Grafana Tempo (trazas)
```

Con exportación directa a Prometheus, solo Prometheus recibe las métricas. Si más adelante se quiere agregar Jaeger para trazas, habría que modificar el código de la aplicación.

**En Alentapp** se usa `PrometheusExporter` directamente (sin Collector) porque el alcance del TP no requiere múltiples backends. En producción real con múltiples microservicios, el Collector sería necesario.

---

### ¿Cómo se relaciona OpenTelemetry con Grafana?

El flujo completo en Alentapp es:

```
DisciplineController
        │
        ▼ (instrumentación manual RED)
  telemetry.ts (OTel SDK)
        │
        ▼ PrometheusExporter
  :9464/metrics (formato Prometheus)
        │
        ▼ scraping cada 15s
    Prometheus (almacena series temporales)
        │
        ▼ datasource
    Grafana (visualiza dashboards RED)
```

Grafana no recibe datos directamente de la app ni de OTel. Consulta a Prometheus usando **PromQL** (Prometheus Query Language) y renderiza los resultados como gráficos, tablas o alertas visuales.

El provisioning de Grafana en Alentapp está configurado para cargar automáticamente:
- El datasource de Prometheus (`observability/grafana/provisioning/datasources/prometheus.yml`)
- Los dashboards RED (`observability/grafana/provisioning/dashboards/default.yml`)

---

## Conclusión

El análisis reveló que el entorno de desarrollo tenía problemas concretos: builds no reproducibles por `npm install`, base de datos expuesta al host, imagen monolítica con devDependencies, filesystem writable via hot-reload y ausencia de `NODE_ENV`. Estos problemas se solucionaron en la Fase 3 mediante multi-stage builds, configuración de seguridad en docker-compose.prod.yml y separación clara de entornos.

La investigación de OpenTelemetry justifica la adopción del SDK con métricas RED para el módulo de disciplinas: estas tres métricas son suficientes para detectar degradación del servicio y generar alertas accionables.
