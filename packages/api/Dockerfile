FROM node:20-alpine

# Instalamos wget para el healthcheck
RUN apk add --no-cache wget

WORKDIR /app

# En un monorepo, es mejor copiar la estructura de paquetes primero
COPY package*.json ./
COPY packages/api/package.json ./packages/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/web/package.json ./packages/web/

# Instalamos todo desde la raíz y cambiamos permisos
RUN npm install && chown -R node:node /app

# Copiamos el resto
COPY --chown=node:node . .

# Cambiamos al usuario no-root
USER node

EXPOSE 3000

# Monitoreo de salud
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# El comando se puede sobreescribir en el compose
CMD ["npm", "run", "dev", "-w", "packages/api"]
