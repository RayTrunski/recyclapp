import { createClient } from "@supabase/supabase-js";

type CreateSupabaseServerClientOptions = {
  useServiceRole?: boolean;
};

function requireServerEnv(value: string | undefined, variable: string) {
  if (!value) {
    throw new Error(`Falta la variable ${variable}.`);
  }

  return value;
}

function resolveSupabaseUrl() {
  return requireServerEnv(
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
    "SUPABASE_URL o NEXT_PUBLIC_SUPABASE_URL",
  );
}

function resolveSupabasePublishableKey() {
  return requireServerEnv(
    process.env.SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    "SUPABASE_PUBLISHABLE_KEY o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  );
}

export function createSupabaseServerClient(
  options: CreateSupabaseServerClientOptions = {},
) {
  const supabaseUrl = resolveSupabaseUrl();
  const supabaseKey = options.useServiceRole
    ? requireServerEnv(
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        "SUPABASE_SERVICE_ROLE_KEY",
      )
    : resolveSupabasePublishableKey();

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
