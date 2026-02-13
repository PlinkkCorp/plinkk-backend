import 'dotenv/config';
import { PrismaClient } from "./generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
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

const config = parse(dbUrl);

// Sanitisation : supprimer tout ce qui n'est pas une chaîne/nombre simple 
// qui pourrait être interprété comme un objet par le driver pg
for (const key in config) {
  const val = (config as any)[key];
  if (val !== null && typeof val === 'object') {
    (config as any)[key] = undefined;
  }
}

// Fix pour TypeScript et pg : ne passer que les champs nécessaires et s'assurer qu'ils sont des primitives
const poolConfig = {
  user: config.user ? String(config.user) : undefined,
  password: config.password ? String(config.password) : undefined,
  host: config.host ? String(config.host) : undefined,
  port: config.port ? parseInt(config.port, 10) : undefined,
  database: config.database ? String(config.database) : undefined,
  ssl: (config as any).ssl ? (config as any).ssl : undefined,
};

const pool = new Pool(poolConfig as any);
const adapter = new PrismaPg(pool as any);
export const prisma = new PrismaClient({ adapter });