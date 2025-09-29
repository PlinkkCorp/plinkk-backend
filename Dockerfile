FROM node:24-alpine
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

RUN apk add --no-cache openssl libc6-compat bash

COPY . .
COPY package.json ./
RUN npm install
RUN npx @fastify/secure-session > src/secret-key
RUN npm run build
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma generate && npm run star"]