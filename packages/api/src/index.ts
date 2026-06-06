import { buildApp } from './app.js';
import { shutdownTelemetry } from './infrastructure/telemetry.js';

const server = buildApp();
const port = parseInt(process.env.PORT || '3000', 10);

server.listen({ port, host: '0.0.0.0' }, () =>
    server.log.info(`API server running on http://localhost:${port}`),
);

['SIGINT', 'SIGTERM'].forEach((signal) => {
    process.on(signal, async () => {
        server.log.info(`Received ${signal}, shutting down gracefully...`);
        await shutdownTelemetry();
        await server.close();
        process.exit(0);
    });
});
