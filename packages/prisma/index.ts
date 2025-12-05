import { PrismaClient } from "./generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg"
import path from "path";
import fs from "fs";

export * from "./generated/prisma";


if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith("file:")) {
	const dbAbsolute = path.resolve(__dirname, "prisma", "dev.db");
	if (!fs.existsSync(dbAbsolute)) {
		fs.writeFileSync(dbAbsolute, "");
	}
	process.env.DATABASE_URL = `file:${dbAbsolute}`;
}

const connectionString = `${process.env.DATABASE_URL}`

const adapter = new PrismaPg({ connectionString })
export const prisma = new PrismaClient({ adapter });