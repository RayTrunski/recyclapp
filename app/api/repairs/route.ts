import { Prisma, RepairStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import {
  buildRepairPayload,
  buildWorkshopPayload,
  type RepairViewRow,
  type WorkshopViewRow,
} from "@/lib/repairs";
import { prisma } from "@/lib/prisma";
import type { CreateRepairInput } from "@/src/types";

function normalizeText(value: string | undefined) {
  return value?.trim() ?? "";
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomRepairStatus() {
  const roll = Math.random();

  if (roll < 0.55) {
    return RepairStatus.QUOTED;
  }

  if (roll < 0.85) {
    return RepairStatus.REQUESTED;
  }

  return RepairStatus.IN_WORK;
}

function getRepairCostRange() {
  const min = randomInt(450, 2800);
  const max = min + randomInt(250, 2200);

  return { min, max };
}

async function readRepairFromView(repairId: string) {
  const rows = await prisma.$queryRaw<RepairViewRow[]>(Prisma.sql`
    SELECT
      id_reparacion,
      id_publicacion,
      nombre_item,
      nombre_categoria,
      descripcion_problema,
      costo_estimado_min,
      costo_estimado_max,
      estado_reparacion,
      nombre_taller,
      fecha_solicitud,
      fecha_cotizacion,
      fecha_finalizacion
    FROM "recyclapp_schema"."v_t_reparacion"
    WHERE id_reparacion = CAST(${repairId} AS uuid)
    LIMIT 1
  `);

  return rows[0] ?? null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = normalizeText(searchParams.get("userId") ?? undefined);

    const [repairRows, workshopRows] = await Promise.all([
      userId
        ? prisma.$queryRaw<RepairViewRow[]>(Prisma.sql`
            SELECT
              id_reparacion,
              id_publicacion,
              nombre_item,
              nombre_categoria,
              descripcion_problema,
              costo_estimado_min,
              costo_estimado_max,
              estado_reparacion,
              nombre_taller,
              fecha_solicitud,
              fecha_cotizacion,
              fecha_finalizacion
            FROM "recyclapp_schema"."v_t_reparacion"
            WHERE id_usuario_solicitante = CAST(${userId} AS uuid)
            ORDER BY COALESCE(fecha_cotizacion, fecha_solicitud, fecha_creacion) DESC
          `)
        : Promise.resolve([]),
      prisma.$queryRaw<WorkshopViewRow[]>(Prisma.sql`
        SELECT
          id_taller_reparacion,
          nombre_taller,
          especialidad,
          telefono,
          calificacion_promedio,
          direccion_linea_1,
          colonia,
          ciudad
        FROM "recyclapp_schema"."v_c_taller_reparacion"
        ORDER BY calificacion_promedio DESC NULLS LAST, nombre_taller ASC
      `),
    ]);

    const workshops = workshopRows.map(buildWorkshopPayload);

    return NextResponse.json(
      {
        requests: repairRows.map(buildRepairPayload),
        workshops,
        featuredWorkshops: workshops.slice(0, 3),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error leyendo reparaciones:", error);

    return NextResponse.json(
      { message: "No fue posible cargar la información de reparaciones." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateRepairInput;
    const requesterId = normalizeText(body.requesterId);
    const listingId = normalizeText(body.listingId);
    const workshopId = normalizeText(body.workshopId);
    const description = normalizeText(body.description);

    if (!requesterId || !listingId || !workshopId) {
      return NextResponse.json(
        { message: "Faltan datos obligatorios para registrar la reparación." },
        { status: 400 },
      );
    }

    const [user, listing, workshop] = await Promise.all([
      prisma.user.findUnique({
        where: { id: requesterId },
        select: { id: true },
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
      prisma.repairWorkshop.findUnique({
        where: { id: workshopId },
        select: {
          id: true,
        },
      }),
    ]);

    if (!user || !listing || !workshop) {
      return NextResponse.json(
        {
          message:
            "No se pudo relacionar la reparación con el usuario, artículo o taller seleccionado.",
        },
        { status: 404 },
      );
    }

    const repairStatus = randomRepairStatus();
    const costRange = getRepairCostRange();
    const requestedAt = new Date();
    const quotedAt =
      repairStatus === RepairStatus.REQUESTED
        ? null
        : new Date(
            requestedAt.getTime() + randomInt(1, 3) * 24 * 60 * 60 * 1000,
          );
    const approvedAt =
      repairStatus === RepairStatus.IN_WORK && quotedAt
        ? new Date(quotedAt.getTime() + 24 * 60 * 60 * 1000)
        : null;

    const createdRepair = await prisma.repairRequest.create({
      data: {
        requesterId: user.id,
        listingId: listing.id,
        workshopId: workshop.id,
        categoryId: listing.categoryId,
        itemName: listing.title,
        description: description || "Solicitud de reparación enviada desde ReCyClapp.",
        estimatedCostMin: new Prisma.Decimal(costRange.min),
        estimatedCostMax: new Prisma.Decimal(costRange.max),
        status: repairStatus,
        requestedAt,
        quotedAt,
        approvedAt,
      },
      select: {
        id: true,
      },
    });

    const repairRow = await readRepairFromView(createdRepair.id);

    return NextResponse.json(
      {
        message: "Solicitud de reparación registrada correctamente.",
        repair: repairRow ? buildRepairPayload(repairRow) : null,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creando reparación:", error);

    return NextResponse.json(
      { message: "No fue posible registrar la reparación en este momento." },
      { status: 500 },
    );
  }
}
