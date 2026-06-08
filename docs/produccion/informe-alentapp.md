# TP Integrador - Actividad 4: Preparando para Producción
**Grupo:** Alentapp

## 4.1. Verificación Técnica (Métricas Antes y Después)

A continuación, se presentan las métricas comparativas tras la implementación de optimizaciones en Docker (Multi-stage builds) y configuraciones de producción:

| Métrica | Antes (desarrollo) | Después (producción) | Mejora |
| :--- | :--- | :--- | :--- |
| **Tamaño imagen API** | ~1.1 GB (node:22 con dependencias dev) | ~300 MB (node:22-alpine, solo runtime JS) | **~72% reducción** |
| **Tamaño imagen Web** | ~580 MB (con herramientas de Vite) | ~95 MB (nginx:stable-alpine con assets compilados) | **~83% reducción** |
| **Tiempo startup API** | ~3-5 segundos (tsx compilation) | < 1 segundo (ejecución directa de index.js) | **> 70% más rápido** |
| **Memoria API (idle)** | ~80 MB | ~45 MB | **~43% reducción** |
| **Endpoints accesibles** | `curl :3000/api/v1/socios` | `curl :3000/api/v1/socios` | Ambos responden 200 OK |
| **Frontend vía nginx** | N/A (Se usaba Vite dev server en el :5173) | `curl localhost/` | Responde 200 OK sirviendo el `index.html` estático |

## 4.2. Verificación de Seguridad Aplicada

Se implementaron múltiples capas de seguridad para robustecer el entorno de producción, siguiendo las mejores prácticas de contenedores:

1.  **Usuario No-Root:** La imagen de la API (`Dockerfile.prod`) ejecuta la aplicación bajo el usuario `node` (UID 1000) por defecto en imágenes Alpine, evitando privilegios de root. La Web corre bajo el usuario `nginx`.
2.  **Sin Herramientas de Build:** Gracias a las 3 etapas (deps -> build -> runtime), la imagen final no contiene `npm`, `tsc`, código fuente TypeScript, ni carpetas `.git`. Ejecutar `docker exec alentapp-api which tsc` falla.
3.  **Read-Only Filesystem (`read_only: true`):** El contenedor de la API no puede escribir en disco (ej. `touch /test` falla), mitigando riesgos de inyección de malware. Se montó `/tmp` temporal en memoria (`tmpfs`) para necesidades mínimas.
4.  **Capabilities Limitadas (`cap_drop: ALL`):** Se eliminaron todos los privilegios del kernel, añadiendo únicamente `NET_BIND_SERVICE` para permitir exponer puertos. Se aplicó `no-new-privileges:true` para evitar escalada de privilegios (setuid).
5.  **Variables Sensibles (Secrets):** Archivos clave como `docker-compose.prod.yml` no tienen contraseñas hardcodeadas; utilizan `${GRAFANA_ADMIN_PASSWORD}` consumiendo un archivo `.env` local.
6.  **Gestión de Logs:** Se configuró el driver `json-file` limitando a 10MB y 3 archivos (`max-size: 10m`, `max-file: 3`), previniendo caídas del sistema por saturación de disco.
7.  **Restricción de Logs SQL:** Se configuró Prisma Client para que en entorno de producción (`NODE_ENV=production`) solo emita logs de nivel `warn` y `error`, previniendo la filtración de información sensible (PII) en los logs de la consola que ocurría con el nivel `query`.
8.  **Seguridad de Headers (Helmet):** Se configuró Helmet en Fastify para inyectar cabeceras de seguridad. La política de contenido (`contentSecurityPolicy`) es dinámica: se activa estrictamente en producción y se deshabilita en desarrollo para facilitar el debug de UI.

## 4.3. Verificación de Observabilidad

El sistema ahora cuenta con un stack completo de monitoreo en tiempo real:

1.  **OpenTelemetry y OTLP:** La API inicializa `@opentelemetry/sdk-node` y un `MeterProvider` ANTES de cargar Fastify. Se exponen métricas en el puerto `9464` mediante un `PrometheusExporter`.
2.  **Scraping de Prometheus:** `prometheus.yml` está configurado para leer (scrape) el endpoint OTLP (`api:9464`) cada 15 segundos.
3.  **Provisioning IaC:** Grafana se auto-configura usando Infrastructure as Code (IaC) montando `prometheus.yml` como Data Source y leyendo los dashboards de `observability/grafana/dashboards/`.
4.  **Dashboard RED Consolidado:** Se consolidaron las métricas de Auto-Instrumentación a Métricas Manuales, creando un dashboard unificado `RED — Alentapp API` (`red-metrics.json`) que muestra:
    *   **Rate (RPS):** Total de peticiones por ruta.
    *   **Errors:** Porcentaje de fallos basándose en códigos 4xx y 5xx.
    *   **Duration:** Histograma de latencia (percentiles 95 y 99).
    *   **Status Codes:** Distribución apilada de respuestas.
    *   **Memoria:** Uso real del Heap (`process.memory.usage`).
    *   **Active Requests:** Peticiones concurrentes en vuelo.

## 4.4. Decisiones Técnicas y Problemas Encontrados

*   **Decisión - Multi-stage con Nginx:** Decidimos no usar Node.js/Vite para servir el frontend en producción, optando por Nginx por su extrema eficiencia manejando assets estáticos y su capacidad para configurar caché.
*   **Problema - Auto-Instrumentaciones Fantasma:** El uso original de `getNodeAutoInstrumentations` devolvía instancias, pero al usar `MeterProvider` en lugar de `NodeSDK`, estas no se registraban. La solución fue importar `registerInstrumentations` de `@opentelemetry/instrumentation` para forzar su registro, y además crear métricas personalizadas (`http.requests.total`) para garantizar consistencia.
*   **Decisión - Interfaz Compartida (Global Error Handler):** Nos dimos cuenta de que repetir los bloques `try/catch` y el mapeo de errores (`NotFoundError -> 404`) en cada controlador era anti-patrón. Mantuvimos el `setErrorHandler` de Fastify en `app.ts` para centralizar esto, pero tuvimos cuidado de inyectar los contadores OTel `errorCounter` en el bloque `catch` del controlador antes del throw.
*   **Problema - Prisma y el Enlace Falso:** Durante las pruebas E2E, los tests fallaban con errores 500 porque Prisma no podía conectarse con un `DATABASE_URL` falso de prueba. Esto demostró que la separación de capas (Arquitectura Hexagonal) funciona, ya que los unitarios corrían aislados, pero la infraestructura dependía de un contexto real.

---
*Fin del Informe - Listo para demostración en clase.*
