const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL || '',
  },
  generator: {
    name: 'client',
    provider: 'prisma-client-js',
    output: '../generated/prisma',
    previewFeatures: ['driverAdapters'],
  },
};
