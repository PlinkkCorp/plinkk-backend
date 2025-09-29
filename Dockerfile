FROM node:24-alpine
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

RUN apk add --no-cache openssl libc6-compat bash

COPY . .
COPY package.json ./
RUN npm install
RUN npx prisma generate
RUN npx @fastify/secure-session > src/secret-key
RUN npm run build
RUN npm prune --production
CMD ["sh", "-c", "npm run start"]