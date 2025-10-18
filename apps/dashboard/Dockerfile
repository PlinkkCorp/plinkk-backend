FROM node:24-alpine

RUN apk add --no-cache \
    openssl \
    libc6-compat \
    bash \
    python3 \
    make \
    g++ \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev

COPY prisma ../prisma
COPY . .
RUN npm install

RUN npx @fastify/secure-session > src/secret-key

RUN npx prisma generate --schema=../../prisma/schema.prisma

RUN npm run build

CMD ["sh", "-c", "npm run prisma:init && npm run seed:role && npm run start"]

EXPOSE 3001