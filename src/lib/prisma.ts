import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function databaseUrlWithTimeout(value: string) {
  try {
    const url = new URL(value);
    if (!url.searchParams.has("connect_timeout")) url.searchParams.set("connect_timeout", "5");
    if (!url.searchParams.has("pool_timeout")) url.searchParams.set("pool_timeout", "5");
    return url.toString();
  } catch {
    return value;
  }
}

export function getPrisma() {
  if (!process.env.DATABASE_URL) return null;

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrlWithTimeout(process.env.DATABASE_URL),
        },
      },
    });
  }

  return globalForPrisma.prisma;
}
