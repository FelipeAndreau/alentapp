import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { metrics } from '@opentelemetry/api';
import { MeterProvider } from '@opentelemetry/sdk-metrics';

// Prometheus Exporter on port 9464
const prometheusExporter = new PrometheusExporter({
  port: 9464,
  endpoint: '/metrics',
});

// Create explicit MeterProvider and bind it globally
const meterProvider = new MeterProvider({
  readers: [prometheusExporter],
});

metrics.setGlobalMeterProvider(meterProvider);

// Auto-instrumentations for HTTP and Fastify
const instrumentations = getNodeAutoInstrumentations({
  '@opentelemetry/instrumentation-http': {},
  '@opentelemetry/instrumentation-fastify': {},
});

registerInstrumentations({
  instrumentations,
});

// Set meter provider for auto-instrumentations
instrumentations.forEach((inst) => {
  if (typeof (inst as any).setMeterProvider === 'function') {
    (inst as any).setMeterProvider(meterProvider);
  }
});

const meter = metrics.getMeter('alentapp-api');

// RED metrics
const requestCounter = meter.createCounter('http.requests.total', {
  description: 'Total HTTP requests',
});

const errorCounter = meter.createCounter('http.requests.errors', {
  description: 'Total HTTP errors (4xx/5xx)',
});

const requestDuration = meter.createHistogram('http.request.duration', {
  description: 'Request duration in ms',
  unit: 'ms',
});

// Additional metrics
const memoryGauge = meter.createObservableGauge('process.memory.usage', {
  description: 'Memory usage in bytes',
  unit: 'bytes',
});

memoryGauge.addCallback((observableResult) => {
  observableResult.observe(process.memoryUsage().heapUsed);
});

const activeRequestsGauge = meter.createObservableGauge('http.requests.active', {
  description: 'Active concurrent requests',
});

let activeRequests = 0;
activeRequestsGauge.addCallback((observableResult) => {
  observableResult.observe(activeRequests);
});

function incrementActiveRequests() {
  activeRequests++;
}

function decrementActiveRequests() {
  activeRequests--;
}

export {
  meter,
  prometheusExporter,
  requestCounter,
  errorCounter,
  requestDuration,
  memoryGauge,
  activeRequestsGauge,
  incrementActiveRequests,
  decrementActiveRequests,
};

export function shutdownTelemetry() {
  return prometheusExporter.shutdown();
}
