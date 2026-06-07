# Fase 1: Análisis de Problemas y Fundamentos de Observabilidad

## Integrante

- **Usuario GitHub:** MaxiC55 (Maximo Carpignano)

---

## Parte A: 5 Problemas Reales de Docker en el Entorno de Desarrollo

### 1. Instalación de devDependencies en producción

**Problema:** El `Dockerfile` original ejecuta `npm install` sin separar dependencias. Esto incluye en la imagen final herramientas como TypeScript, ESLint, Vitest y Husky que nunca se usan en producción.

| Dónde ocurre                                      | Impacto                                        | Solución propuesta                                                       |
| ------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------ |
| `packages/api/Dockerfile` línea `RUN npm install` | **Alto** — imagen ~1GB innecesariamente pesada | Usar `npm ci --omit=dev` en la etapa de producción del multi-stage build |

**Solución aplicada:** El `Dockerfile.prod` usa tres etapas separadas: `deps` instala solo prod deps, `build` compila TypeScript, y `runtime` copia solo el JS compilado y las node_modules de producción.

---

### 2. Ausencia de límites de recursos (CPU y memoria)

**Problema:** El `docker-compose.yml` de desarrollo no define `deploy.resources.limits`. Un proceso Node.js con una fuga de memoria o un loop infinito puede consumir toda la RAM del host y afectar a los demás servicios.

| Dónde ocurre                               | Impacto                                   | Solución propuesta                                                               |
| ------------------------------------------ | ----------------------------------------- | -------------------------------------------------------------------------------- |
| `docker-compose.yml` — todos los servicios | **Alto** — riesgo de OOM y caída del host | Agregar `deploy.resources.limits` con CPU y memoria en `docker-compose.prod.yml` |

**Solución aplicada:** `docker-compose.prod.yml` define límites explícitos: API → 256MB RAM / 0.5 CPU, DB → 256MB / 0.5 CPU, Web → 128MB / 0.3 CPU.

---

### 3. Filesystem de escritura en producción (sin `read_only`)

**Problema:** Los contenedores de desarrollo montan el filesystem con permisos de escritura completos. Si un atacante logra ejecutar código arbitrario dentro del contenedor, puede modificar archivos del sistema o plantar backdoors.

| Dónde ocurre                                   | Impacto                               | Solución propuesta                                                          |
| ---------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------- |
| `docker-compose.yml` — servicios `api` y `web` | **Alto** — superficie de ataque mayor | Agregar `read_only: true` y montar `tmpfs` para rutas temporales necesarias |

**Solución aplicada:** `docker-compose.prod.yml` incluye `read_only: true` en API y Web. Se agregan `tmpfs` para `/tmp` (API) y `/tmp`, `/var/cache/nginx`, `/var/run` (Web/nginx).

---

### 4. Variables sensibles hardcodeadas o sin template

**Problema:** El entorno de desarrollo usa valores por defecto directamente en el compose (`POSTGRES_PASSWORD`, `DATABASE_URL`) sin una separación clara entre lo que es secreto y lo que es configuración. Existe riesgo de commitear credenciales reales al repositorio.

| Dónde ocurre                               | Impacto                                            | Solución propuesta                                                                          |
| ------------------------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `docker-compose.yml` valores `environment` | **Medio** — fuga de secretos si se commitea `.env` | Usar `env_file: .env`, agregar `.env` al `.gitignore`, y proveer `.env.production.template` |

**Solución aplicada:** `docker-compose.prod.yml` usa `env_file: - .env` y el repo incluye `.env.production.template` con valores de ejemplo, nunca el `.env` real.

---

### 5. Imagen base de desarrollo Node.js 20 en lugar de Node.js 22 Alpine

**Problema:** El `Dockerfile` original usa `node:20-alpine` que ya está en modo LTS de mantenimiento. Además no es la última versión LTS estable, por lo que pierde parches de seguridad más recientes.

| Dónde ocurre                                          | Impacto                                                 | Solución propuesta                                        |
| ----------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------- |
| `packages/api/Dockerfile` línea `FROM node:20-alpine` | **Medio** — vulnerabilidades de seguridad no parcheadas | Migrar a `node:22-alpine` que es la LTS activa hasta 2027 |

**Solución aplicada:** `Dockerfile.prod` usa `node:22-alpine` en todas las etapas, que recibe parches de seguridad activos y tiene mejor rendimiento por V8 más nuevo.

---

## Parte B: Preguntas sobre OpenTelemetry

### ¿Qué es OpenTelemetry y cómo se diferencia de Prometheus?

**OpenTelemetry (OTel)** es un estándar abierto y un conjunto de herramientas, APIs y SDKs para instrumentar aplicaciones y recolectar datos de observabilidad (trazas, métricas y logs). Es vendor-neutral: no está atado a ninguna plataforma de monitoreo específica.

**Prometheus** es un sistema de monitoreo y base de datos de series de tiempo que _recolecta_ métricas haciendo scraping a endpoints HTTP. Es la capa de almacenamiento y consulta.

La diferencia clave: OpenTelemetry es el **estándar de instrumentación** (cómo se generan los datos), mientras que Prometheus es una **plataforma de almacenamiento y consulta** (dónde van esos datos). OpenTelemetry puede exportar a Prometheus, a Jaeger, a Datadog, o a cualquier backend compatible con OTLP.

---

### Los "3 pilares" de la observabilidad

Los tres pilares son:

- **Logs**: registros discretos de eventos que ocurrieron (texto con timestamp)
- **Métricas**: valores numéricos agregados en el tiempo (contadores, histogramas, gauges)
- **Trazas**: seguimiento del flujo de una request a través de múltiples servicios distribuidos

OpenTelemetry aborda los **tres pilares** con un SDK unificado. Antes de OTel, cada pilar usaba herramientas diferentes (ELK para logs, Prometheus para métricas, Jaeger para trazas) con instrumentación incompatible entre sí.

---

### Métricas RED (Rate, Errors, Duration)

Las métricas RED son un patrón propuesto por Tom Wilkie (Grafana Labs) para monitorear microservicios orientados a requests:

| Métrica      | Qué mide                                    | Para qué sirve                                                                      |
| ------------ | ------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Rate**     | Cantidad de requests por segundo            | Ver el volumen de tráfico actual; detectar picos inesperados                        |
| **Errors**   | Porcentaje de requests que fallan (4xx/5xx) | Alertar cuando la tasa de error supera un umbral; detectar degradación del servicio |
| **Duration** | Latencia de las requests (p50, p95, p99)    | Medir la performance percibida por el usuario; identificar cuellos de botella       |

En este proyecto, las tres métricas se capturan manualmente en cada controller con `requestCounter`, `errorCounter` y `requestDuration` exportados desde `telemetry.ts`.

---

### ¿Qué es OTLP y qué ventaja tiene frente a exportar directamente a Prometheus?

**OTLP (OpenTelemetry Protocol)** es el protocolo nativo de OpenTelemetry para transmitir datos de observabilidad entre componentes. Usa gRPC o HTTP/JSON como transporte.

Ventajas de OTLP frente a exportar directo a Prometheus:

- **Vendor-neutral**: el mismo código de instrumentación puede enviar datos a Prometheus, Jaeger, Datadog, New Relic, o cualquier backend compatible, sin cambiar el código de la app.
- **Soporta los 3 pilares**: OTLP transporta métricas, trazas y logs en un solo protocolo. El exportador directo de Prometheus solo soporta métricas.
- **Push vs Pull**: OTLP usa modelo push (la app envía datos al collector), lo que facilita entornos con firewalls o infraestructura efímera donde Prometheus no puede hacer scraping.
- **OTel Collector**: permite procesar, filtrar y enrutar datos antes de enviarlos al backend final, sin tocar el código de la app.

---

### ¿Cómo se relaciona OpenTelemetry con Grafana?

Grafana es la capa de **visualización**. OpenTelemetry genera y exporta los datos; Grafana los consulta y los muestra en dashboards.

El flujo en este proyecto es:

```
API (Node.js + OTel SDK)
    → PrometheusExporter en :9464/metrics
        → Prometheus (scraping cada 15s)
            → Grafana (datasource Prometheus → dashboards RED)
```

Grafana también soporta conectarse directamente a un OTel Collector vía OTLP si se usa Grafana Tempo (para trazas) o Grafana Loki (para logs), pero en este proyecto usamos la vía simplificada con PrometheusExporter.
