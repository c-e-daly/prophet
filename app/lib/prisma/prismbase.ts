// app/lib/prisma/base.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prismaBase?: PrismaClient };

export const prismaBase =
  globalForPrisma.prismaBase ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaBase = prismaBase;
}

export default prismaBase;
