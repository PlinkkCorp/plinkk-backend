import { PrismaClient } from "./generated/prisma/client";
import path from "path";
import fs from "fs";

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith("file:")) {
	const dbAbsolute = path.resolve(__dirname, "prisma", "dev.db");
	if (!fs.existsSync(dbAbsolute)) {
		fs.writeFileSync(dbAbsolute, "");
	}
	process.env.DATABASE_URL = `file:${dbAbsolute}`;
}

export const prisma = new PrismaClient();