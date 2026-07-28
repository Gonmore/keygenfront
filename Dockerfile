# frontend/Dockerfile
FROM node:18-alpine AS base

# Fase 1: Instalar dependencias
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Fase 2: Construir la aplicación
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Durante el build, declaramos estas variables para que Next.js las procese si es necesario
ARG KEYGEN_API_URL
ARG KEYGEN_ACCOUNT_ID
ARG KEYGEN_ADMIN_TOKEN
RUN npm run build

# Fase 3: Imagen de producción
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV PORT 3000

# Creamos un usuario no root por seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]