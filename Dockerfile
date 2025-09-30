FROM node:24-alpine AS builder

RUN apk add --no-cache openssl libc6-compat bash

COPY . .
RUN npm install
RUN npx prisma generate
RUN npx @fastify/secure-session > src/secret-key
RUN npm run build:withoutcp

RUN cp -r src/public dist/public
RUN cp -r src/views dist/views
RUN cp -r src/secret-key dist/secret-key

RUN npm prune --production
CMD ["sh", "-c", "npm run start"]