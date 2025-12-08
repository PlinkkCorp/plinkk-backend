import { defineConfig } from '@prisma/config';
import 'dotenv/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL || '',
  },
  // @ts-ignore
  generator: {
    name: 'client',
    provider: 'prisma-client-js',
    output: '../generated/prisma',
    previewFeatures: ['driverAdapters'],
  },
});
