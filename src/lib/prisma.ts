import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";

config({ path: path.resolve(process.cwd(), ".env") });

function databaseUrl() {
  const raw = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  const filePath = raw.replace(/^file:/, "");
  if (path.isAbsolute(filePath)) return `file:${filePath}`;
  return `file:${path.join(process.cwd(), "prisma", path.basename(filePath))}`;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const adapter = new PrismaBetterSqlite3({ url: databaseUrl() });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
