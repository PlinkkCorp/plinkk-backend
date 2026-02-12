import { defineConfig } from '@prisma/config';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

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
