import 'dotenv/config';
import { PrismaClient } from "./generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool, PoolConfig } from "pg";
import { parse } from "pg-connection-string";

export * from "./generated/prisma/index.js";

const dbUrl = process.env.DATABASE_URL;

// Nettoyage radical de l'environnement pour éviter que le driver pg ne récupère des objets invalides
for (const key in process.env) {
  if (key.startsWith('PG')) {
    delete process.env[key];
  }
}

if (!dbUrl || dbUrl === "undefined") {
  throw new Error("[Prisma] DATABASE_URL is not defined in .env or environment.");
}

const config = parse(dbUrl) as Record<string, unknown>;

// Sanitisation : supprimer tout ce qui n'est pas une chaîne/nombre simple 
// qui pourrait être interprété comme un objet par le driver pg
for (const key in config) {
  const val = config[key];
  if (val !== null && typeof val === 'object') {
    config[key] = undefined;
  }
}

// Fix pour TypeScript et pg : ne passer que les champs nécessaires et s'assurer qu'ils sont des primitives
const poolConfig = {
  user: typeof config.user === 'string' ? config.user : undefined,
  password: typeof config.password === 'string' ? config.password : undefined,
  host: typeof config.host === 'string' ? config.host : undefined,
  port: typeof config.port === 'string' ? parseInt(config.port, 10) : undefined,
  database: typeof config.database === 'string' ? config.database : undefined,
  ssl: config.ssl ? config.ssl as boolean | { rejectUnauthorized?: boolean } : undefined,
} satisfies PoolConfig;

const pool = new Pool(poolConfig);
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });