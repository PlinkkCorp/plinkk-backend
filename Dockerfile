FROM mhart/alpine-node:12.16.3
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

COPY . .
RUN npm install
RUN npx @fastify/secure-session > src/secret-key
RUN npm run build
COPY ./dist /
COPY ./package.json /package.json
CMD ["npm", "run", "start"]