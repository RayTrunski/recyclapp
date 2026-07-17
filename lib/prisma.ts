import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { resolveRuntimeDatabaseUrl } from "./database-url";

const globalForPrisma = globalThis as {
  prisma?: PrismaClient;
};

export function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: resolveRuntimeDatabaseUrl(),
  }, {
    schema: "recyclapp_schema",
  });

  return new PrismaClient({ adapter });
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
