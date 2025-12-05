import { PrismaClient } from "./generated/prisma/index";
// import { PrismaPg } from "@prisma/adapter-pg"
import path from "path";
import fs from "fs";

export * from "./generated/prisma/index";


if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith("file:")) {
	const dbAbsolute = path.resolve(__dirname, "prisma", "dev.db");
	const dbDir = path.dirname(dbAbsolute);
	if (!fs.existsSync(dbDir)) {
		fs.mkdirSync(dbDir, { recursive: true });
	}
	if (!fs.existsSync(dbAbsolute)) {
		fs.writeFileSync(dbAbsolute, "");
	}
	process.env.DATABASE_URL = `file:${dbAbsolute}`;
}

// const connectionString = `${process.env.DATABASE_URL}`

// const adapter = new PrismaPg({ connectionString })
// export const prisma = new PrismaClient({ adapter });
export const prisma = new PrismaClient();