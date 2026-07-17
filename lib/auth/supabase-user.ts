import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type EnsureSupabaseAuthUserInput = {
  appUserId: string;
  email: string;
  password: string;
  existingAuthUserId?: string | null;
};

type EnsureSupabaseAuthUserResult = {
  enabled: boolean;
  authUserId?: string;
  message?: string;
};

function isServiceRoleConfigured() {
  return Boolean(
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY,
  );
}

export async function ensureSupabaseAuthUser(
  input: EnsureSupabaseAuthUserInput,
): Promise<EnsureSupabaseAuthUserResult> {
  if (!isServiceRoleConfigured()) {
    return {
      enabled: false,
      message:
        "Falta SUPABASE_SERVICE_ROLE_KEY o SUPABASE_SECRET_KEY para habilitar Realtime.",
    };
  }

  const supabase = createSupabaseServerClient({ useServiceRole: true });
  const appMetadata = { app_user_id: input.appUserId };

  try {
    let authUserId = input.existingAuthUserId ?? null;

    if (!authUserId) {
      const { data, error } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

      if (error) {
        throw error;
      }

      const users = (data?.users ?? []) as Array<{
        id: string;
        email?: string | null;
      }>;

      const matchedUser = users.find(
        (user) => user.email?.toLowerCase() === input.email.toLowerCase(),
      );

      authUserId = matchedUser?.id ?? null;
    }

    if (authUserId) {
      const { error } = await supabase.auth.admin.updateUserById(authUserId, {
        email: input.email,
        password: input.password,
        email_confirm: true,
        app_metadata: appMetadata,
      });

      if (error) {
        throw error;
      }
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: true,
        app_metadata: appMetadata,
      });

      if (error) {
        throw error;
      }

      authUserId = data.user.id;
    }

    await prisma.user.update({
      where: { id: input.appUserId },
      data: {
        supabaseAuthUserId: authUserId,
      },
    });

    return {
      enabled: true,
      authUserId,
    };
  } catch (error) {
    console.error("No fue posible sincronizar el usuario con Supabase Auth:", error);

    return {
      enabled: false,
      message:
        "La cuenta inició sesión, pero Supabase Auth no quedó disponible para mensajería en tiempo real.",
    };
  }
}
