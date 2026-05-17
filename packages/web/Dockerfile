FROM node:20-alpine

# Instalamos wget para el healthcheck
RUN apk add --no-cache wget

WORKDIR /app

# Instalación de dependencias
COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/web/package*.json ./packages/web/
RUN npm install && chown -R node:node /app

# Copiado de código fuente
COPY --chown=node:node . .

# Usuario no-root
USER node

EXPOSE 5173

# Healthcheck para el dev server
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5173/ || exit 1

# IMPORTANTE: El flag --host permite que el tráfico salga del contenedor
CMD ["npm", "run", "dev", "-w", "packages/web", "--", "--host", "0.0.0.0"]
