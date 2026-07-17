import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type UpdateLocationRequest = {
  userId?: string;
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number | null;
  source?: string;
  sharedConversationId?: string | null;
};

function normalizeText(value: string | undefined | null) {
  return value?.trim() ?? "";
}

function normalizeSource(value: string | undefined) {
  const normalized = normalizeText(value).toUpperCase();

  if (normalized === "MESSAGE_SHARE") {
    return "MESSAGE_SHARE";
  }

  return "ACCESS";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as UpdateLocationRequest;
    const userId = normalizeText(body.userId);
    const sharedConversationId = normalizeText(body.sharedConversationId ?? undefined);
    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);
    const accuracyMeters =
      body.accuracyMeters == null ? null : Number(body.accuracyMeters);

    if (
      !userId ||
      Number.isNaN(latitude) ||
      Number.isNaN(longitude) ||
      (accuracyMeters != null && Number.isNaN(accuracyMeters))
    ) {
      return NextResponse.json(
        { message: "La ubicación requiere usuario, latitud y longitud válidas." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true },
    });

    if (!user?.isActive) {
      return NextResponse.json(
        { message: "No se encontró un usuario activo para guardar la ubicación." },
        { status: 404 },
      );
    }

    if (sharedConversationId) {
      const membership = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId: sharedConversationId,
          userId,
        },
        select: { id: true },
      });

      if (!membership) {
        return NextResponse.json(
          { message: "No puedes compartir ubicación en una conversación ajena." },
          { status: 403 },
        );
      }
    }

    const location = await prisma.userLastLocation.upsert({
      where: { userId },
      update: {
        latitude: new Prisma.Decimal(latitude),
        longitude: new Prisma.Decimal(longitude),
        accuracyMeters:
          accuracyMeters == null
            ? null
            : new Prisma.Decimal(accuracyMeters.toFixed(2)),
        capturedAt: new Date(),
        source: normalizeSource(body.source),
        sharedConversationId: sharedConversationId || null,
      },
      create: {
        userId,
        latitude: new Prisma.Decimal(latitude),
        longitude: new Prisma.Decimal(longitude),
        accuracyMeters:
          accuracyMeters == null
            ? null
            : new Prisma.Decimal(accuracyMeters.toFixed(2)),
        capturedAt: new Date(),
        source: normalizeSource(body.source),
        sharedConversationId: sharedConversationId || null,
      },
      select: {
        userId: true,
        latitude: true,
        longitude: true,
        accuracyMeters: true,
        capturedAt: true,
        source: true,
        sharedConversationId: true,
      },
    });

    return NextResponse.json(
      {
        location: {
          userId: location.userId,
          latitude: Number(location.latitude.toString()),
          longitude: Number(location.longitude.toString()),
          accuracyMeters: location.accuracyMeters
            ? Number(location.accuracyMeters.toString())
            : null,
          capturedAt: location.capturedAt.toISOString(),
          source: location.source,
          sharedConversationId: location.sharedConversationId,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error guardando ubicación:", error);

    return NextResponse.json(
      { message: "No fue posible guardar la ubicación actual." },
      { status: 500 },
    );
  }
}
