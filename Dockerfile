FROM node:24-alpine
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

RUN apk add --no-cache openssl libc6-compat bash

COPY . .
COPY package.json ./
RUN npm ci
RUN npx @fastify/secure-session > src/secret-key
RUN npx prisma migrate deploy
RUN npx prisma generate
RUN npm run build
CMD ["sh", "-c", "npm", "run", "start"]