FROM mhart/alpine-node:12.16.3
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

RUN apk add --no-cache openssl libc6-compat bash

COPY . .
COPY ./package.json /package.json
RUN npm install
RUN npx @fastify/secure-session > src/secret-key
RUN npx prisma generate
RUN npm run build
CMD ["npm", "run", "start"]