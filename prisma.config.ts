import { defineConfig } from "prisma/config";

export default defineConfig({
    
  migrations: {
    seed: `ts-node prisma/seed.ts`,
  },
});