FROM node:24-alpine

RUN apk add --no-cache openssl libc6-compat bash

COPY . .
RUN npm install

RUN npx @fastify/secure-session > src/secret-key

RUN npx prisma generate

RUN npm run build

RUN npx prisma migrate dev

CMD ["sh", "-c", "npm run start"]

EXPOSE 3001