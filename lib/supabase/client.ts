import { createBrowserClient } from "@supabase/ssr";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

function requireClientEnv(value: string | undefined, variable: string) {
  if (!value) {
    throw new Error(`Falta la variable ${variable}.`);
  }

  return value;
}

export function createSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient;
  }

  const supabaseUrl = requireClientEnv(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    "NEXT_PUBLIC_SUPABASE_URL",
  );
  const supabaseKey = requireClientEnv(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  );

  browserClient = createBrowserClient(supabaseUrl, supabaseKey);

  return browserClient;
}
