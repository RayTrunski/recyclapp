import { prisma } from "../prisma";

type SessionRole = "user" | "collector" | "admin";

export type LoginInput = {
  usuario?: string;
  password?: string;
};

export type LoginResult =
  | {
      success: true;
      status: 200;
      user: {
        id: string;
        email: string;
        role: SessionRole;
        supabaseAuthUserId: string | null;
      };
    }
  | {
      success: false;
      status: 400 | 401;
      message: string;
    };

function normalizarRol(rol: "USER" | "COLLECTOR" | "ADMIN"): SessionRole {
  switch (rol) {
    case "ADMIN":
      return "admin";
    case "COLLECTOR":
      return "collector";
    default:
      return "user";
  }
}

export async function loginWithCredentials(
  input: LoginInput,
): Promise<LoginResult> {
  const identificador = input.usuario?.trim();
  const password = input.password?.trim();

  if (!identificador || !password) {
    return {
      success: false,
      status: 400,
      message: "Usuario y contraseña son obligatorios.",
    };
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identificador.toLowerCase() }, { displayName: identificador }],
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      role: true,
      passwordHash: true,
      supabaseAuthUserId: true,
    },
  });

  if (!user || user.passwordHash !== password) {
    return {
      success: false,
      status: 401,
      message: "Credenciales inválidas.",
    };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLoginAt: new Date(),
    },
  });

  return {
    success: true,
    status: 200,
    user: {
      id: user.id,
      email: user.email,
      role: normalizarRol(user.role),
      supabaseAuthUserId: user.supabaseAuthUserId,
    },
  };
}
