import "dotenv/config";

import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

import { resolveDatabaseUrl } from "../lib/database-url";

const prismaArgs = process.argv.slice(2);

if (prismaArgs.length === 0) {
  console.error("Uso: tsx scripts/run-prisma.ts <comandos de prisma>");
  process.exit(1);
}

const prismaCliEntry = resolve("node_modules/prisma/build/index.js");

const result = spawnSync(process.execPath, [prismaCliEntry, ...prismaArgs], {
  stdio: "inherit" as const,
  env: {
    ...process.env,
    DATABASE_URL: resolveDatabaseUrl(),
  },
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
