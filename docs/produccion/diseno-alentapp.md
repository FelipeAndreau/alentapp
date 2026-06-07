# Fase 2: Diseño de la Solución de Producción

## Grupo
- **Integrantes:** Felipe Andreau, Maximo Carpignano, Pedro Fiuza, Jesus Vergara

---

## 1. Visión General de la Arquitectura de Producción

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Cliente    │────▶│   Nginx      │────▶│  Fastify API │
│   (Browser)  │     │   (Web Prod) │     │  (API Prod)  │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                    ┌─────────────────────────────┘
                    │
         ┌──────────▼──────────┐
         │   OpenTelemetry SDK │
         │  (RED metrics +     │
         │   auto-instrument)    │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │ PrometheusExporter  │
         │      (port 9464)     │
         └──────────┬──────────┘
                    │
    ┌───────────────┼───────────────┐
    │               │               │
┌───▼────┐    ┌────▼────┐    ┌────▼────┐
│Prometheus│    │ Grafana │    │  PostgreSQL  │
│(scrape) │    │(visual) │    │  (datos)     │
└─────────┘    └─────────┘    └─────────────┘
```

---

## 2. Especificación de Docker Multi-Stage

### 2.1 API (`packages/api/Dockerfile.prod`)

**Etapa 1: `deps`** (Build dependencies)
- **Base:** `node:22-alpine`
- **Propósito:** Instalar dependencias de producción en un entorno limpio.
- **Comandos clave:**
  ```dockerfile
  COPY package*.json ./
  COPY packages/api/package*.json packages/api/
  COPY packages/shared/package*.json packages/shared/
  COPY packages/web/package*.json packages/web/
  RUN npm ci --ignore-scripts --only=production
  ```
- **Truco:** `--ignore-scripts` evita que Husky (devDependency) falle al intentar ejecutar hooks sin devDependencies.

**Etapa 2: `build`** (TypeScript compilation)
- **Propósito:** Compilar TypeScript a JavaScript y eliminar fuentes.
- **Comandos clave:**
  ```dockerfile
  COPY --from=deps /app/node_modules ./node_modules
  COPY . .
  RUN npx tsc -b tsconfig.prod.json
  RUN find packages -name '*.ts' -not -name '*.d.ts' -delete
  ```
- **Resultado:** Solo quedan `.js` y `.d.ts` en `packages/`. El entrypoint es `packages/api/src/index.js`.

**Etapa 3: `runtime`** (Production runtime)
- **Propósito:** Imagen mínima para ejecutar la API.
- **Seguridad:**
  - `USER node` — proceso corre con UID 1000 (no-root).
  - `HEALTHCHECK` — verifica `/api/health` cada 30s.
  - Sin `tsc`, sin `npm` innecesario (aunque alpine incluye npm por defecto; no hay dev tools).
- **CMD:** `node --enable-source-maps packages/api/src/index.js`

### 2.2 Web (`packages/web/Dockerfile.prod`)

**Etapa 1: `deps`**
- Instala dependencias de producción incluyendo las del workspace `shared`.

**Etapa 2: `build`**
- Ejecuta `vite build` en `packages/web`.
- Genera assets estáticos en `packages/web/dist/`.

**Etapa 3: `nginx`**
- **Base:** `nginx:stable-alpine`
- **Configuración:**
  - `nginx.conf` con compresión gzip, cache headers y security headers (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy).
  - SPA fallback: `try_files $uri $uri/ /index.html` para React Router.
- **Puerto:** 80 (HTTP).

---

## 3. Configuración de Seguridad en Docker Compose

| Servicio | Seguridad | Valor | Justificación |
|----------|-----------|-------|---------------|
| **API** | `read_only: true` | Sí | Evita que un atacante modifique el filesystem (ej: descargar malware). |
| **API** | `cap_drop: ALL` | Sí | Elimina todos los capabilities Linux del contenedor. |
| **API** | `cap_add: NET_BIND_SERVICE` | Sí | Permite bind a puertos < 1024 si fuera necesario (mínimo requerido). |
| **API** | `no-new-privileges:true` | Sí | Previene escalada de privilegios vía setuid binaries. |
| **API** | `tmpfs: /tmp` | Sí | Provee un directorio escribible volátil para archivos temporales. |
| **API** | Resource limits | 0.5 CPU / 256M RAM | Previene que un leak de memoria agote el host. |
| **Web** | Resource limits | 0.3 CPU / 128M RAM | Nginx es muy ligero; no necesita más. |
| **DB** | Resource limits | 0.5 CPU / 256M RAM | Limita el impacto de queries pesadas. |
| **Todos** | Red custom | `alentapp-prod-net` | Aislamiento de tráfico y resolución DNS por nombre de servicio. |
| **Todos** | Logging rotation | 10m / 3 archivos | Previene que logs consuman todo el disco. |

---

## 4. Arquitectura de Observabilidad

### 4.1 OpenTelemetry SDK (`packages/api/src/infrastructure/telemetry.ts`)

**Componentes:**
- **Resource:** Identifica el servicio como `alentapp-api`.
- **MeterProvider:** Registra los instruments personalizados.
- **PrometheusExporter:** Expone métricas en formato Prometheus en `:9464/metrics`.
- **Auto-instrumentations:** `@opentelemetry/auto-instrumentations-node` instrumenta HTTP entrante/saliente y Fastify automáticamente.

**Instruments personalizados (RED + extras):**

| Nombre | Tipo | Descripción | Atributos |
|--------|------|-------------|-----------|
| `http.requests.total` | Counter | Total de requests por endpoint | `method`, `route`, `status` |
| `http.requests.errors` | Counter | Requests con status >= 400 | `method`, `route`, `status` |
| `http.request.duration` | Histogram | Latencia en ms | `method`, `route`, `status` |
| `http.requests.active` | UpDownCounter | Requests en vuelo | `method`, `route` |
| `process.memory.usage` | ObservableGauge | Uso de memoria en bytes | — |

**Flujo de datos:**
1. Request entra al `PaymentController`.
2. El SDK de OTel (auto) crea un span HTTP.
3. El código manual inicia un timer, incrementa `http.requests.active`.
4. Al finalizar, se incrementa `http.requests.total`, se registra duración en histogram, y si hay error se incrementa `http.requests.errors`.
5. El `PrometheusExporter` expone todo en `:9464/metrics`.

### 4.2 Prometheus

**Rol:** Scraper y almacenamiento de series temporales.

**Configuración (`observability/prometheus/prometheus.yml`):**
- Scrape interval: 15s
- 3 jobs:
  - `prometheus` — self-monitoring.
  - `alentapp-api` — Fastify app en `:3000` (métricas de negocio vía auto-instrumentation).
  - `opentelemetry` — OTel PrometheusExporter en `:9464` (métricas RED personalizadas).

**Retención:** 15 días de datos.

### 4.3 Grafana

**Rol:** Visualización y alerting.

**Provisioning:**
- **Datasource:** Prometheus configurado automáticamente vía archivo de provisioning (`datasources/prometheus.yml`).
- **Dashboards:** Cargados desde `observability/grafana/dashboards/` vía provider config (`provisioning/dashboards/default.yml`).

**Dashboard RED de Pagos (`red-payments.json`):**

| Panel | Métrica / Query | Tipo de Visualización |
|-------|-----------------|----------------------|
| 1. Requests/sec | `rate(http_requests_total[1m])` | Time series |
| 2. Error % | `rate(http_requests_errors[1m]) / rate(http_requests_total[1m]) * 100` | Time series |
| 3. Latency p95 | `histogram_quantile(0.95, rate(http_request_duration_bucket[5m]))` | Time series |
| 4. Latency p99 | `histogram_quantile(0.99, rate(http_request_duration_bucket[5m]))` | Time series |
| 5. Requests by Status | `sum by (status) (rate(http_requests_total[5m]))` | Stacked bar |
| 6. Memory Usage | `process_memory_usage_bytes` | Gauge / Single stat |

**Configuración de seguridad:**
- `GF_USERS_ALLOW_SIGN_UP=false` — evita registro de usuarios no autorizados.
- Admin password via variable de entorno (no hardcodeado).

---

## 5. Decisiones de Diseño Clave

### 5.1 ¿Por qué PrometheusExporter y no OTLP?

El enunciado requería un endpoint de métricas accesible vía HTTP. `PrometheusExporter` expone directamente `/metrics` en formato Prometheus, sin necesidad de un OTel Collector intermedio. Esto reduce complejidad en desarrollo y cumple el requisito de "observar el estado de la aplicación".

### 5.2 ¿Por qué instrumentar solo el PaymentController?

El alcance del TP se centró en el módulo de pagos. Instrumentar solo este módulo demuestra la técnica sin modificar decenas de archivos. En producción real, se extendería a todos los controllers vía un middleware o interceptor centralizado.

### 5.3 ¿Por qué no usar un OTel Collector?

Para el alcance del TP, el Collector es over-engineering. Con `PrometheusExporter`, Prometheus scrapea directamente la app. En un entorno real con múltiples servicios, un Collector centralizado sería necesario para agregar, enriquecer y reenviar telemetría a múltiples backends (Prometheus + Jaeger + Datadog).

### 5.4 ¿Por qué separar entrypoints (`index.ts` vs `app.ts`)?

`app.ts` exporta `buildApp()` para testing (unit + integration). `index.ts` es el entrypoint exclusivo de producción que inicia el servidor, importa telemetría y maneja señales de shutdown. Esta separación permite testear la app sin que intente abrir un puerto.

---

## 6. Matriz de Verificación

| Requisito del Enunciado | Implementación | Archivo(s) |
|------------------------|----------------|------------|
| Multi-stage build API | 3 etapas (deps/build/runtime) | `packages/api/Dockerfile.prod` |
| Multi-stage build Web | 3 etapas (deps/build/nginx) | `packages/web/Dockerfile.prod` |
| Usuario no-root | `USER node` (UID 1000) | `packages/api/Dockerfile.prod` |
| Healthcheck | `HEALTHCHECK` en API | `packages/api/Dockerfile.prod` |
| `read_only` + `cap_drop` | docker-compose security opts | `docker-compose.prod.yml` |
| Resource limits | CPU/memory por servicio | `docker-compose.prod.yml` |
| Logging rotation | `json-file` con max-size/max-file | `docker-compose.prod.yml` |
| Red custom | `alentapp-prod-net` | `docker-compose.prod.yml` |
| OpenTelemetry SDK | SDK con PrometheusExporter | `packages/api/src/infrastructure/telemetry.ts` |
| Métricas RED | 5 instruments en PaymentController | `packages/api/src/delivery/payments/PaymentController.ts` |
| Prometheus scrape | `prometheus.yml` con 3 jobs | `observability/prometheus/prometheus.yml` |
| Grafana dashboard | 6 panels RED | `observability/grafana/dashboards/red-payments.json` |
| Provisioning automático | Datasource + dashboards vía archivos | `observability/grafana/provisioning/` |
| Graceful shutdown | `shutdownTelemetry()` en SIGINT/SIGTERM | `packages/api/src/index.ts` |

---

## 7. Instrucciones de Ejecución

### Levantar el stack completo
```bash
cp .env.production.template .env
# Editar .env con tus credenciales
docker compose -f docker-compose.prod.yml up -d --build
```

### Verificar servicios
```bash
# API health
curl http://localhost:3000/api/health

# OTel metrics
curl http://localhost:9464/metrics

# Prometheus UI
open http://localhost:9090

# Grafana UI (admin/admin)
open http://localhost:3001
```

### Generar tráfico de prueba
```bash
for i in {1..20}; do
  curl -s http://localhost:3000/api/payments > /dev/null
done
```

---

## 8. Instrumentación del Módulo de Lockers

Extendiendo el patrón RED implementado originalmente en el `PaymentController`, el módulo de Casilleros (Lockers) quedó completamente instrumentado.

### 8.1 Endpoints instrumentados

Los cuatro handlers del `LockerController` registran las métricas RED con labels `method`, `route` y `status`:

| Endpoint | Método | Handler | Status codes registrados |
|----------|--------|---------|--------------------------|
| `/api/v1/lockers` | GET | `getAll` | 200, 500 |
| `/api/v1/lockers` | POST | `create` | 201, 400, 409, 500 |
| `/api/v1/lockers/:id` | PUT | `update` | 200, 400, 404, 409, 500 |
| `/api/v1/lockers/:id` | DELETE | `delete` | 200, 404, 409, 500 |

Cada handler sigue el mismo flujo: inicia un timer y llama a `incrementActiveRequests()` al entrar, registra `requestCounter` y `errorCounter` según el resultado, y en el bloque `finally` registra `requestDuration` y llama a `decrementActiveRequests()`, garantizando que la duración y el conteo de requests activos se actualicen aunque el handler falle.

### 8.2 Dashboard RED de Lockers

El dashboard `observability/grafana/dashboards/red-lockers.json` replica el esquema de los demás módulos con 6 paneles, todos filtrando por `route=~"/api/v1/lockers.*"`:

| Panel | Query | Tipo |
|-------|-------|------|
| 1. Requests/seg | `sum(rate(http_requests_total{route=~"/api/v1/lockers.*"}[1m])) by (method, route)` | Time series |
| 2. Tasa de error (%) | `sum(rate(http_requests_errors{...}[1m])) / sum(rate(http_requests_total{...}[1m])) * 100` | Time series |
| 3. Latencia p95/p99 | `histogram_quantile(0.95/0.99, sum(rate(http_request_duration_bucket{...}[5m])) by (le))` | Time series |
| 4. Por código de estado | `sum by (status) (rate(http_requests_total{...}[5m]))` | Time series |
| 5. Memoria del proceso | `process_memory_usage / 1024 / 1024` | Time series |
| 6. Endpoints más lentos | `topk(5, avg by (route) (rate(http_request_duration_sum{...}[5m])) / avg by (route) (rate(http_request_duration_count{...}[5m])))` | Bar gauge |

### 8.3 Alertas de Lockers

En `observability/prometheus/rules.yml` se agregó el grupo `alentapp-lockers` con dos reglas, siguiendo el mismo formato que disciplines y sports:

| Alerta | Condición | Duración |
|--------|-----------|----------|
| `LockerHighErrorRate` | error rate > 5% | 2m |
| `LockerHighLatency` | latencia p95 > 1000ms | 2m |

---

## Conclusión del Diseño

La solución cumple con los requisitos de seguridad, eficiencia y observabilidad del enunciado. El diseño es minimalista pero extensible: agregar nuevos controllers instrumentados solo requiere importar `getMeter` y replicar el patrón RED, Prometheus y Grafana ya están provisionados para recibir los datos automáticamente.
