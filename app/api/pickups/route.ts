import { PickupStatus, Prisma, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";

import {
  buildPickupPayload,
  OWNER_PICKUP_NOTE_PREFIX,
  type PickupViewRow,
} from "@/lib/pickups";
import { prisma } from "@/lib/prisma";
import type { CreatePickupInput } from "@/src/types";

function normalizeText(value: string | undefined) {
  return value?.trim() ?? "";
}

function parseLocationInput(location: string) {
  const parts = location
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    addressLine1: parts[0] ?? location,
    neighborhood: parts.length >= 3 ? parts[1] : null,
    municipality: parts.length >= 4 ? parts[parts.length - 2] : null,
    city: parts.length >= 2 ? parts[parts.length - 1] : location,
  };
}

function buildNotes(notes: string) {
  const normalizedNotes = normalizeText(notes);

  if (!normalizedNotes) {
    return OWNER_PICKUP_NOTE_PREFIX;
  }

  return `${OWNER_PICKUP_NOTE_PREFIX} ${normalizedNotes}`;
}

async function readPickupFromView(pickupId: string) {
  const rows = await prisma.$queryRaw<PickupViewRow[]>(Prisma.sql`
    SELECT
      id_recoleccion,
      id_publicacion,
      nombre_categoria,
      titulo_item,
      notas,
      bloque_horario,
      estado_recoleccion,
      nombre_recolector,
      estado,
      ciudad,
      municipio,
      colonia,
      direccion_linea_1,
      direccion_linea_2,
      fecha_preferida,
      fecha_programada,
      fecha_recolectada,
      fecha_cancelacion,
      fecha_creacion
    FROM "recyclapp_schema"."v_t_recoleccion"
    WHERE id_recoleccion = CAST(${pickupId} AS uuid)
    LIMIT 1
  `);

  return rows[0] ?? null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = normalizeText(searchParams.get("userId") ?? undefined);

    if (!userId) {
      return NextResponse.json(
        { message: "Falta el userId para consultar la agenda de recolecciones." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "No se encontró el usuario para consultar su agenda." },
        { status: 404 },
      );
    }

    const filterClause =
      user.role === UserRole.COLLECTOR
        ? Prisma.sql`id_recolector = CAST(${userId} AS uuid)`
        : Prisma.sql`id_usuario_solicitante = CAST(${userId} AS uuid)`;

    const rows = await prisma.$queryRaw<PickupViewRow[]>(Prisma.sql`
      SELECT
        id_recoleccion,
        id_publicacion,
        nombre_categoria,
        titulo_item,
        notas,
        bloque_horario,
        estado_recoleccion,
        nombre_recolector,
        estado,
        ciudad,
        municipio,
        colonia,
        direccion_linea_1,
        direccion_linea_2,
        fecha_preferida,
        fecha_programada,
        fecha_recolectada,
        fecha_cancelacion,
        fecha_creacion
      FROM "recyclapp_schema"."v_t_recoleccion"
      WHERE ${filterClause}
      ORDER BY COALESCE(fecha_programada, fecha_preferida, fecha_creacion) DESC
    `);

    return NextResponse.json(rows.map(buildPickupPayload), { status: 200 });
  } catch (error) {
    console.error("Error leyendo agenda de recolecciones:", error);

    return NextResponse.json(
      { message: "No fue posible cargar la agenda de recolecciones." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreatePickupInput;
    const requesterId = normalizeText(body.requesterId);
    const listingId = normalizeText(body.listingId);
    const address = normalizeText(body.address);
    const date = normalizeText(body.date);
    const timeSlot = normalizeText(body.timeSlot) || "Por coordinar";

    if (!requesterId || !listingId || !address || !date) {
      return NextResponse.json(
        { message: "Faltan datos obligatorios para agendar la recolección." },
        { status: 400 },
      );
    }

    const [user, listing] = await Promise.all([
      prisma.user.findUnique({
        where: { id: requesterId },
        select: {
          id: true,
          phone: true,
          firstName: true,
          lastName: true,
          displayName: true,
          defaultAddress: {
            select: {
              country: true,
              state: true,
              city: true,
            },
          },
        },
      }),
      prisma.listing.findFirst({
        where: {
          id: listingId,
          ownerId: requesterId,
          isActive: true,
        },
        select: {
          id: true,
          title: true,
          categoryId: true,
        },
      }),
    ]);

    if (!user || !listing) {
      return NextResponse.json(
        {
          message:
            "No se pudo relacionar la recolección con el usuario o el artículo seleccionado.",
        },
        { status: 404 },
      );
    }

    const parsedLocation = parseLocationInput(address);
    const collectors = await prisma.user.findMany({
      where: {
        role: UserRole.COLLECTOR,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    const assignedCollector =
      collectors[Math.floor(Math.random() * collectors.length)] ?? null;

    const pickupRequest = await prisma.$transaction(async (tx) => {
      const pickupAddress = await tx.address.create({
        data: {
          ownerId: user.id,
          label: "Retiro agendado",
          contactName:
            user.displayName ??
            `${user.firstName} ${user.lastName ?? ""}`.trim(),
          phone: user.phone,
          country: user.defaultAddress?.country ?? "MX",
          state: user.defaultAddress?.state ?? parsedLocation.city,
          city: parsedLocation.city || user.defaultAddress?.city || "Sin ciudad",
          municipality: parsedLocation.municipality,
          neighborhood: parsedLocation.neighborhood,
          addressLine1: parsedLocation.addressLine1,
        },
      });

      return tx.pickupRequest.create({
        data: {
          listingId: listing.id,
          requesterId: user.id,
          collectorId: assignedCollector?.id ?? null,
          pickupAddressId: pickupAddress.id,
          categoryId: listing.categoryId,
          itemTitle: listing.title,
          notes: buildNotes(body.notes),
          preferredDate: new Date(date),
          timeSlotLabel: timeSlot,
          status: assignedCollector ? PickupStatus.ASSIGNED : PickupStatus.SCHEDULED,
          scheduledAt: new Date(date),
        },
        select: {
          id: true,
        },
      });
    });

    const pickupRow = await readPickupFromView(pickupRequest.id);

    return NextResponse.json(
      {
        message: "Recolección agendada correctamente.",
        pickup: pickupRow ? buildPickupPayload(pickupRow) : null,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creando recolección:", error);

    return NextResponse.json(
      { message: "No fue posible registrar la recolección en este momento." },
      { status: 500 },
    );
  }
}
