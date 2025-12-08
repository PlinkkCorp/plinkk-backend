import { PrismaClient } from "./generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
// import { PrismaPg } from "@prisma/adapter-pg"
import path from "path";
import fs from "fs";

export * from "./generated/prisma/client";


if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith("file:")) {
    let dbAbsolute;
    // Try to find workspace root to locate the central database
    let currentDir = __dirname;
    let workspaceRoot = null;
    while (currentDir !== path.parse(currentDir).root) {
        if (fs.existsSync(path.join(currentDir, "pnpm-workspace.yaml"))) {
            workspaceRoot = currentDir;
            break;
        }
        currentDir = path.dirname(currentDir);
    }

    if (workspaceRoot) {
        dbAbsolute = path.join(workspaceRoot, "packages", "prisma", "prisma", "dev.db");
    } else {
        const isDist = __dirname.endsWith("dist");
        dbAbsolute = isDist
            ? path.resolve(__dirname, "..", "prisma", "dev.db")
            : path.resolve(__dirname, "prisma", "dev.db");
    }

    console.log("Prisma DB Path:", dbAbsolute);
	const dbDir = path.dirname(dbAbsolute);
	if (!fs.existsSync(dbDir)) {
		fs.mkdirSync(dbDir, { recursive: true });
	}
	// if (!fs.existsSync(dbAbsolute)) {
	// 	fs.writeFileSync(dbAbsolute, "");
	// }
	process.env.DATABASE_URL = `file:${dbAbsolute}`;
}

const connectionString = `${process.env.DATABASE_URL}`

const adapter = new PrismaLibSql({ url: connectionString });
export const prisma = new PrismaClient({ adapter });