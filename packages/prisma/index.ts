import 'dotenv/config';
import { PrismaClient } from "./generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool, PoolConfig } from "pg";
import { parse } from "pg-connection-string";

export * from "./generated/prisma/index.js";

for (const key in process.env) {
  if (key.startsWith('PG')) {
    delete process.env[key];
  }
}

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl || dbUrl === "undefined") {
  throw new Error("[Prisma] DATABASE_URL is not defined in .env or environment.");
}

const config = parse(dbUrl) as Record<string, string | boolean | undefined>;

for (const key in config) {
  const val = config[key];
  if (val !== null && typeof val === 'object') {
    config[key] = undefined;
  }
}

const poolConfig: PoolConfig = {
  user: config.user ? String(config.user) : undefined,
  password: config.password ? String(config.password) : undefined,
  host: config.host ? String(config.host) : undefined,
  port: config.port ? parseInt(String(config.port), 10) : undefined,
  database: config.database ? String(config.database) : undefined,
  ssl: !!config.ssl ? (config.ssl as boolean | object) : undefined,
};

const pool = new Pool(poolConfig);
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });