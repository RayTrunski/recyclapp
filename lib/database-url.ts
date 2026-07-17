function stripWrappingQuotes(value: string) {
  return value.trim().replace(/^['"]|['"]$/g, "");
}

export function resolveDatabaseUrl() {
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

  return normalizedUrl.toString();
}
