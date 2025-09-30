FROM node:24-alpine

RUN apk add --no-cache openssl libc6-compat bash

# Installer les dépendances (inclut dev pour TypeScript et @types/node)
COPY package.json ./
RUN npm install --include=dev

# Copier le reste du code
COPY . .

# Générer une clé de session pour l'app
RUN npx @fastify/secure-session > src/secret-key

# RUN npx Prisma migrate deploy

# Build (tsc + copie des assets via script)
RUN npm run build

# Lancer l'app avec migrations Prisma au démarrage
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma generate && npm run start"]

EXPOSE 3001
