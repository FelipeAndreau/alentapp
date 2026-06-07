# Fase 1: Análisis de Problemas y Fundamentos de Observabilidad

## Integrante
- **Usuario:** JesusVergara04

---

## Parte A: 5 Problemas Reales de Docker en el Entorno de Desarrollo

Tras leer la configuración Docker existente del proyecto (`docker-compose.yml` y `packages/api/Dockerfile`), identifiqué los siguientes problemas respecto a buenas prácticas de producción:

### 1. Credenciales de base de datos hardcodeadas y duplicadas

**Problema:** En `docker-compose.yml`, la contraseña de PostgreSQL está escrita en texto plano y además aparece duplicada en dos lugares distintos:

```yaml
db:
  environment:
    POSTGRES_USER: admin
    POSTGRES_PASSWORD: password123      # ← primera aparición
api:
  environment:
    - DATABASE_URL=postgres://admin:password123@db:5432/alentapp_db   # ← segunda aparición
```

**Dónde ocurre:** `docker-compose.yml` — servicio `db` (clave `POSTGRES_PASSWORD`) y servicio `api` (dentro de `DATABASE_URL`).

**Impacto:** Alto. La credencial está versionada en el repositorio, por lo que cualquier persona con acceso al código (o al historial de git) la puede leer. Además, la duplicación es un problema de mantenibilidad: si se cambia la contraseña en un solo lugar y se olvida el otro, la API deja de poder conectarse a la base de datos. Rotar la credencial requiere editar dos puntos del código y rehacer el deploy.

**Solución propuesta:** Extraer la contraseña a un archivo `.env` ignorado por git y referenciarla con interpolación en un único punto de verdad. El `DATABASE_URL` se arma a partir de la misma variable, evitando la duplicación.

```yaml
db:
  environment:
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
api:
  environment:
    - DATABASE_URL=postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
```

---

### 2. Las migraciones de Prisma corren en el `command` del compose

**Problema:** El servicio `api` ejecuta las migraciones de la base de datos como parte del comando de arranque, antes de levantar la aplicación:

```yaml
command: >
  sh -c "npx prisma migrate deploy --config packages/api/prisma.config.ts &&
   npx prisma generate --config packages/api/prisma.config.ts &&
   npx tsx watch packages/api/src/app.ts"
```

**Dónde ocurre:** `docker-compose.yml` — servicio `api`, clave `command`.

**Impacto:** Medio. Acoplar la migración al arranque de cada contenedor de la API genera problemas si en algún momento se escala horizontalmente: si dos instancias de la API arrancan al mismo tiempo, ambas intentan correr `migrate deploy` simultáneamente, lo que puede producir una race condition sobre el esquema de la base. Las migraciones deberían ser un paso separado y único, no algo que ejecuta cada réplica al iniciar.

**Solución propuesta:** Separar las migraciones en un servicio efímero dedicado (o un job de CI/CD) que corra una sola vez antes de levantar la API, dejando el `command` de la API enfocado solo en arrancar el proceso.

---

### 3. Imagen en modo desarrollo: `tsx watch` y `npm run dev` en el Dockerfile

**Problema:** Tanto el `command` del compose como el `CMD` del Dockerfile usan herramientas de desarrollo con hot-reload:

```dockerfile
# packages/api/Dockerfile
CMD ["npm", "run", "dev", "-w", "packages/api"]
```
```yaml
# docker-compose.yml
command: > sh -c "... npx tsx watch packages/api/src/app.ts"
```

`tsx watch` recompila TypeScript en caliente cada vez que cambia un archivo, algo pensado para desarrollo, no para correr en producción.

**Dónde ocurre:** `packages/api/Dockerfile` (`CMD`) y `docker-compose.yml` (`command`).

**Impacto:** Alto. Ejecutar la app con `tsx watch` en producción significa que el TypeScript se transpila en tiempo de ejecución en lugar de servir JavaScript ya compilado, lo que consume más CPU y memoria y arranca más lento. Además, mantiene un watcher de archivos activo que no tiene ningún propósito en un contenedor inmutable de producción.

**Solución propuesta:** Compilar TypeScript a JavaScript en una etapa de build y ejecutar el JS resultante con `node` directamente. Esto se resuelve con el `Dockerfile.prod` multi-stage creado en la Fase 3, donde el `CMD` final es `node packages/api/src/index.js`.

---

### 4. Puerto 5432 de PostgreSQL expuesto al host

**Problema:** El servicio `db` mapea su puerto al host:

```yaml
db:
  ports:
    - '5432:5432'
```

**Dónde ocurre:** `docker-compose.yml` — servicio `db`, clave `ports`.

**Impacto:** Alto. La base de datos solo necesita ser accesible desde la API, que está en la misma red Docker. Exponer el puerto 5432 al host la deja alcanzable desde cualquier proceso de la máquina y, si el firewall no está bien configurado, desde la red local. Es una superficie de ataque innecesaria sobre el componente que guarda todos los datos del sistema.

**Solución propuesta:** No mapear el puerto de la base de datos al host en producción. La API la alcanza por nombre de servicio (`db:5432`) dentro de la red Docker interna sin necesidad de exponerla.

---

### 5. Imagen de una sola etapa con todas las dependencias y `npm install`

**Problema:** El `Dockerfile` usa una única etapa que instala todas las dependencias con `npm install` (sin `--omit=dev` ni `npm ci`):

```dockerfile
FROM node:20-alpine
...
RUN npm install && chown -R node:node /app
COPY --chown=node:node . .
```

**Dónde ocurre:** `packages/api/Dockerfile` — imagen base única, línea `RUN npm install`.

**Impacto:** Alto. La imagen final contiene devDependencies (TypeScript, tsx, Vitest, ESLint, Husky) que no se usan en producción, inflando el tamaño y aumentando la superficie de ataque. Además, `npm install` puede resolver versiones distintas a las del `package-lock.json`, generando builds no reproducibles: dos builds del mismo código pueden terminar con dependencias diferentes.

**Solución propuesta:** Implementar un multi-stage build (`deps` → `build` → `runtime`) usando `npm ci --omit=dev` en la etapa de dependencias de producción, de forma que la imagen final solo contenga el JavaScript compilado y las dependencias estrictamente necesarias. Esto reduce la imagen de ~1GB a ~300MB y garantiza reproducibilidad.

---

## Parte B: Fundamentos de Observabilidad

### ¿Qué es OpenTelemetry y cómo se diferencia de Prometheus?

**OpenTelemetry (OTel)** es un proyecto de la CNCF que estandariza la instrumentación, generación, recolección y exportación de datos de telemetría (métricas, logs y trazas) de forma vendor-neutral. Se instrumenta la aplicación una sola vez y se puede cambiar el backend de observabilidad sin tocar el código.

**Prometheus** es una herramienta de monitoreo y base de datos de series temporales enfocada exclusivamente en **métricas**. Usa un modelo **pull**: hace scraping periódico del endpoint `/metrics` de la aplicación.

| Aspecto | OpenTelemetry | Prometheus |
|---------|--------------|------------|
| Alcance | Métricas + Logs + Trazas | Solo métricas |
| Modelo | Push o Pull (configurable) | Pull (scraping) |
| Vendor | Vendor-neutral (CNCF) | Ecosistema propio |
| Destino | Múltiples backends | Base de datos propia (TSDB) |
| Rol en Alentapp | Instrumenta la app | Almacena y consulta |

Se complementan: OTel instrumenta la app y exporta las métricas en formato Prometheus mediante el `PrometheusExporter`, que Prometheus luego scrapea y almacena.

---

### Los 3 pilares de la observabilidad

1. **Logs:** Eventos discretos con timestamp. En Alentapp, Fastify genera logs JSON estructurados por cada request (método, URL, status, tiempo de respuesta). Sirven para debugging post-mortem y auditoría.

2. **Métricas:** Valores numéricos agregados en el tiempo. Eficientes para dashboards y alertas. Ejemplos: requests por segundo, latencia p95, uso de memoria.

3. **Trazas (Distributed Traces):** Siguen el recorrido completo de un request a través del sistema, descompuesto en spans. Permiten ver dónde se produce la latencia en una cadena de llamadas.

**OpenTelemetry aborda los tres pilares** desde un único SDK. En este proyecto se usan principalmente métricas, exportadas a Prometheus.

---

### Métricas RED (Rate, Errors, Duration)

El método RED, propuesto por Tom Wilkie (Weaveworks), define el conjunto mínimo de métricas para monitorear un servicio HTTP:

| Letra | Métrica | Qué mide | Para qué sirve | Tipo OTel |
|-------|---------|----------|----------------|-----------|
| **R** | **Rate** | Requests por segundo | Carga actual del servicio | `Counter` |
| **E** | **Errors** | Porcentaje de requests 4xx/5xx | Salud del servicio | `Counter` con atributo `status` |
| **D** | **Duration** | Latencia de cada request | Experiencia del usuario (p95/p99) | `Histogram` |

En Alentapp implementé RED en el `LockerController`:
- **Rate:** `http.requests.total` — se incrementa en cada handler con labels `method`, `route`, `status`.
- **Errors:** `http.requests.errors` — se incrementa solo cuando el status es 4xx o 5xx.
- **Duration:** `http.request.duration` — histogram que mide desde la entrada al handler hasta la respuesta. Se registra en el bloque `finally` para garantizar que se mide incluso si el request falla.

---

### ¿Qué es el OTLP (OpenTelemetry Protocol)?

OTLP es el protocolo nativo de OpenTelemetry para transmitir telemetría, sobre gRPC o HTTP/protobuf.

**Ventaja frente a exportar directo a Prometheus:** con OTLP, la app envía los datos a un **OTel Collector** que puede reenviarlos simultáneamente a múltiples backends:

```
App (OTLP) → OTel Collector → Prometheus (métricas)
                            → Jaeger (trazas)
                            → Loki (logs)
```

Con exportación directa a Prometheus solo Prometheus recibe las métricas; agregar otro backend exigiría modificar el código. En Alentapp se usa `PrometheusExporter` directo sin Collector porque el alcance del proyecto no requiere múltiples backends.

---

### ¿Cómo se relaciona OpenTelemetry con Grafana?

Flujo completo para el módulo de Lockers:

```
LockerController (getAll, create, update, delete)
        │  instrumentación manual RED
        ▼
  telemetry.ts (OTel SDK + MeterProvider)
        │  PrometheusExporter
        ▼
  :9464/metrics (formato Prometheus)
        │  scraping cada 15s
        ▼
    Prometheus (series temporales)
        │  datasource PromQL
        ▼
    Grafana (dashboard red-lockers.json, 6 paneles)
```

Grafana no recibe datos directamente de la app: consulta a Prometheus con PromQL y renderiza los gráficos. El provisioning carga automáticamente el datasource y los dashboards al arrancar.

---

## Conclusión

La lectura del `docker-compose.yml` y el `Dockerfile` actuales reveló problemas concretos: credenciales hardcodeadas y duplicadas, migraciones acopladas al arranque de cada contenedor, ejecución en modo desarrollo (`tsx watch`) en lugar de JS compilado, puerto de base de datos expuesto al host e imagen monolítica con `npm install` no reproducible. Todos se resuelven en la Fase 3 mediante multi-stage builds, separación de entornos y configuración de seguridad en `docker-compose.prod.yml`.

La investigación de OpenTelemetry justifica la instrumentación RED que implementé en el `LockerController`: Rate, Errors y Duration son suficientes para detectar degradación del servicio y generar alertas accionables sobre el módulo de casilleros.