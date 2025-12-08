import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL,
  },
  generator: {
    name: 'client',
    provider: 'prisma-client-js',
    output: '../generated/prisma',
    previewFeatures: ['driverAdapters'],
  },
});
