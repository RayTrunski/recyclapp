function stripWrappingQuotes(value: string) {
  return value.trim().replace(/^['"]|['"]$/g, "");
}

function buildDatabaseUrl({ useLibpqCompat = false }: { useLibpqCompat?: boolean } = {}) {
  const rawUrl = process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL;

  if (!rawUrl) {
    throw new Error("Falta DATABASE_URL o SUPABASE_DB_URL.");
  }

  const normalizedUrl = new URL(stripWrappingQuotes(rawUrl));

  if (!normalizedUrl.searchParams.get("schema")) {
    normalizedUrl.searchParams.set("schema", "recyclapp_schema");
  }

  if (
    normalizedUrl.hostname.includes("supabase.") &&
    !normalizedUrl.searchParams.get("sslmode")
  ) {
    normalizedUrl.searchParams.set("sslmode", "require");
  }

  if (
    useLibpqCompat &&
    normalizedUrl.searchParams.get("sslmode") === "require" &&
    !normalizedUrl.searchParams.get("uselibpqcompat")
  ) {
    normalizedUrl.searchParams.set("uselibpqcompat", "true");
  }

  return normalizedUrl.toString();
}

export function resolveDatabaseUrl() {
  return buildDatabaseUrl();
}

export function resolveRuntimeDatabaseUrl() {
  return buildDatabaseUrl({ useLibpqCompat: true });
}
