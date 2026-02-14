import 'dotenv/config';
import { PrismaClient } from "./generated/prisma/index.js";

export * from "./generated/prisma/index.js";


/* 
// Nettoyage radical de l'environnement pour éviter que le driver pg ne récupère des objets invalides
for (const key in process.env) {
  if (key.startsWith('PG')) {
    delete process.env[key];
  }
}

if (!dbUrl || dbUrl === "undefined") {
  throw new Error("[Prisma] DATABASE_URL is not defined in .env or environment.");
}

const config = parse(dbUrl) as Record<string, string | boolean | undefined>;

// Sanitisation : supprimer tout ce qui n'est pas une chaîne/nombre simple 
// qui pourrait être interprété comme un objet par le driver pg
for (const key in config) {
  const val = config[key];
  if (val !== null && typeof val === 'object') {
    config[key] = undefined;
  }
}

// Fix pour TypeScript et pg : ne passer que les champs nécessaires et s'assurer qu'ils sont des primitives
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
*/

export const prisma = new PrismaClient();