# Dockerfile para Backend Boston Club
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias y OPENSSL (necesario para Prisma)
RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
COPY prisma ./prisma/
RUN npm install

# Copiar código y construir
COPY . .
RUN npx prisma generate
RUN npm run build

# Imagen de producción
FROM node:20-alpine

WORKDIR /app

# También instalar openssl en la imagen final
RUN apk add --no-cache openssl libc6-compat

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/*.js ./


EXPOSE 8080

CMD ["sh", "-c", "npx prisma db push && npm start"]
