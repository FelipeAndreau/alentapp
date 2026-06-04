# Análisis Individual — Jesus Vergara

## 1. Problemas identificados en la infraestructura Docker actual

| Problema | ¿Dónde ocurre? | Impacto | Solución propuesta |
|----------|---------------|---------|-------------------|
| Imagen sin multi-stage build: se incluyen devDependencies y herramientas de compilación en la imagen final | `packages/api/Dockerfile` | Alto — imagen innecesariamente grande (~1GB), mayor superficie de ataque | Usar multi-stage build con etapas `deps`, `build` y `runtime` separadas |
| Contenedor corre como root | `packages/api/Dockerfile` | Alto — si hay una vulnerabilidad, el atacante tiene control total del sistema | Crear usuario no-root (`node`) y usar `USER node` en la etapa runtime |
| No hay healthchecks definidos | `docker-compose.yml` | Medio — Docker no sabe si el servicio está realmente funcionando, puede enrutar tráfico a contenedores caídos | Agregar `HEALTHCHECK` en los Dockerfiles y `healthcheck` en el compose |
| No hay límites de recursos (CPU/memoria) | `docker-compose.yml` | Medio — un servicio puede consumir todos los recursos del host y tumbar los demás | Agregar `deploy.resources.limits` por servicio |
| Variables de entorno sensibles hardcodeadas | `docker-compose.yml` | Alto — credenciales expuestas en el repositorio | Cargar variables desde archivo `.env` con `env_file` y nunca commitear el `.env` real |

---

## 2. Investigación sobre OpenTelemetry

### ¿Qué es OpenTelemetry y cómo se diferencia de Prometheus?

OpenTelemetry es un estándar abierto para instrumentar aplicaciones y generar los tres tipos de datos de observabilidad: logs, métricas y trazas. No está atado a ninguna herramienta específica — recolecta los datos y los puede exportar a Prometheus, Grafana, Datadog, o cualquier backend compatible.

Prometheus en cambio es una herramienta específica de recolección y almacenamiento de métricas. Se basa en un modelo de "scraping": cada cierto tiempo va a buscar las métricas al endpoint `/metrics` de la aplicación. No maneja logs ni trazas, solo métricas numéricas.

La diferencia clave es que OpenTelemetry es vendor-neutral: instrumentás la app una sola vez y podés cambiar el backend de observabilidad sin tocar el código. Con Prometheus estás acoplado a su ecosistema.

### Los 3 pilares de la observabilidad

- **Logs**: registro de eventos discretos. Ejemplo: "El usuario X creó el casillero 5 a las 14:30".
- **Métricas**: valores numéricos que cambian con el tiempo. Ejemplo: requests por segundo, uso de memoria.
- **Trazas**: el recorrido completo de un request a través del sistema, mostrando cuánto tardó cada paso.

OpenTelemetry aborda los tres pilares. En este proyecto usamos principalmente métricas, exportadas a Prometheus.

### Métricas RED

El método RED define las tres métricas más importantes para cualquier servicio:

- **Rate**: cuántos requests por segundo está recibiendo el servicio. Sirve para saber el volumen de tráfico actual.
- **Errors**: qué porcentaje de esos requests están fallando (4xx/5xx). Sirve para detectar problemas en producción.
- **Duration**: cuánto tarda en responder el servicio. Sirve para medir la experiencia del usuario.

En el proyecto estas tres métricas están implementadas en `telemetry.ts` como `requestCounter`, `errorCounter` y `requestDuration`, y se registran en cada handler del controller.

### ¿Qué es OTLP y qué ventaja tiene frente a exportar directo a Prometheus?

OTLP (OpenTelemetry Protocol) es el protocolo estándar de OpenTelemetry para transmitir datos de telemetría. En lugar de que Prometheus vaya a buscar las métricas (pull), con OTLP la aplicación las empuja (push) hacia un collector.

La ventaja es que OTLP puede transportar los tres tipos de datos (logs, métricas y trazas) en un solo protocolo, mientras que el exporter de Prometheus solo maneja métricas. Además, con un OTel Collector en el medio se pueden transformar, filtrar y enrutar los datos a múltiples backends sin cambiar el código de la aplicación.

### ¿Cómo se relaciona OpenTelemetry con Grafana?

OpenTelemetry recolecta y exporta los datos. Grafana los visualiza. En este proyecto el flujo es:

App (Fastify) → OpenTelemetry SDK → PrometheusExporter (:9464/metrics) → Prometheus → Grafana

Grafana tiene a Prometheus como datasource y consulta las métricas usando PromQL para mostrarlas en dashboards.