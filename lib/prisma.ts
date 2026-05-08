import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const prismaLogLevel: Array<"query" | "warn" | "error"> =
  process.env.NODE_ENV === "production" ? ["warn", "error"] : ["query", "warn", "error"];

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: prismaLogLevel,
    transactionOptions: {
      timeout: 15000,
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
