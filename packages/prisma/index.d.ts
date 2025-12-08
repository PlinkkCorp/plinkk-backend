import { PrismaClient } from "./generated/prisma/index";
import { PrismaPg } from "@prisma/adapter-pg";
export * from "./generated/prisma/index";
export declare const prisma: PrismaClient<{
    adapter: PrismaPg;
}, never, import("./generated/prisma/runtime/library").DefaultArgs>;
