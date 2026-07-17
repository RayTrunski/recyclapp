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
        name: string;
        phone: string;
        address: string;
        avatarUrl: string | null;
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

function formatDisplayName(user: {
  displayName: string | null;
  firstName: string;
  lastName: string | null;
  email: string;
}) {
  const fullName = `${user.firstName} ${user.lastName ?? ""}`.trim();

  return user.displayName ?? fullName ?? user.email;
}

function formatAddress(address?: {
  addressLine1: string;
  neighborhood: string | null;
  city: string;
} | null) {
  if (!address) {
    return "";
  }

  return [address.addressLine1, address.neighborhood, address.city]
    .filter(Boolean)
    .join(", ");
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
      firstName: true,
      lastName: true,
      displayName: true,
      phone: true,
      avatarUrl: true,
      defaultAddress: {
        select: {
          addressLine1: true,
          neighborhood: true,
          city: true,
        },
      },
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
      name: formatDisplayName(user),
      phone: user.phone ?? "",
      address: formatAddress(user.defaultAddress),
      avatarUrl: user.avatarUrl,
      role: normalizarRol(user.role),
      supabaseAuthUserId: user.supabaseAuthUserId,
    },
  };
}
