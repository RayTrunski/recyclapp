import { UserRole } from "@prisma/client";

import { prisma } from "../prisma";

type SessionRole = "user" | "collector" | "admin";

export type RegisterInput = {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  email?: string;
  password?: string;
  phone?: string;
  addressLine1?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
};

export type RegisterResult =
  | {
      success: true;
      status: 201;
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
      status: 400 | 409;
      message: string;
    };

function normalizeText(value: string | undefined) {
  return value?.trim() ?? "";
}

function normalizeRole(role: UserRole): SessionRole {
  switch (role) {
    case UserRole.ADMIN:
      return "admin";
    case UserRole.COLLECTOR:
      return "collector";
    default:
      return "user";
  }
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

export async function registerUser(
  input: RegisterInput,
): Promise<RegisterResult> {
  const firstName = normalizeText(input.firstName);
  const lastName = normalizeText(input.lastName);
  const displayName = normalizeText(input.displayName);
  const email = normalizeText(input.email).toLowerCase();
  const password = normalizeText(input.password);
  const phone = normalizeText(input.phone);
  const addressLine1 = normalizeText(input.addressLine1);
  const neighborhood = normalizeText(input.neighborhood);
  const city = normalizeText(input.city);
  const state = normalizeText(input.state);

  if (!firstName || !email || !password) {
    return {
      success: false,
      status: 400,
      message:
        "Nombre, correo y contraseña son obligatorios para crear la cuenta.",
    };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return {
      success: false,
      status: 409,
      message: "Ya existe una cuenta registrada con ese correo.",
    };
  }

  const createdUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        firstName,
        lastName: lastName || null,
        displayName: displayName || null,
        email,
        passwordHash: password,
        phone: phone || null,
        role: UserRole.USER,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        role: true,
        supabaseAuthUserId: true,
        firstName: true,
        lastName: true,
        displayName: true,
        phone: true,
        avatarUrl: true,
      },
    });

    let defaultAddress:
      | {
          addressLine1: string;
          neighborhood: string | null;
          city: string;
        }
      | null = null;

    if (addressLine1 && city && state) {
      const address = await tx.address.create({
        data: {
          ownerId: user.id,
          label: "Dirección principal",
          contactName:
            displayName || `${firstName} ${lastName}`.trim() || firstName,
          phone: phone || null,
          country: "MX",
          state,
          city,
          neighborhood: neighborhood || null,
          addressLine1,
        },
        select: {
          id: true,
          addressLine1: true,
          neighborhood: true,
          city: true,
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          defaultAddressId: address.id,
        },
      });

      defaultAddress = {
        addressLine1: address.addressLine1,
        neighborhood: address.neighborhood,
        city: address.city,
      };
    }

    return {
      ...user,
      defaultAddress,
    };
  });

  const fullName =
    createdUser.displayName ??
    `${createdUser.firstName} ${createdUser.lastName ?? ""}`.trim() ??
    createdUser.email;

  return {
    success: true,
    status: 201,
    user: {
      id: createdUser.id,
      email: createdUser.email,
      name: fullName || createdUser.email,
      phone: createdUser.phone ?? "",
      address: formatAddress(createdUser.defaultAddress),
      avatarUrl: createdUser.avatarUrl,
      role: normalizeRole(createdUser.role),
      supabaseAuthUserId: createdUser.supabaseAuthUserId,
    },
  };
}
