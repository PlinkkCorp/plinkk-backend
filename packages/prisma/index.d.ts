import { PrismaClient } from "./generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
export * from "./generated/prisma";
export declare const prisma: PrismaClient<{
    adapter: PrismaPg;
}, never, import("./generated/prisma/runtime/library").DefaultArgs>;
