import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    conversationId: string;
  }>;
};

type CreateMessageRequest = {
  userId?: string;
  body?: string;
  messageType?: string;
  latitude?: number | null;
  longitude?: number | null;
  accuracyMeters?: number | null;
  locationLabel?: string | null;
};

function normalizeText(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function normalizeMessageType(value: string | undefined) {
  const normalized = normalizeText(value).toUpperCase();

  if (normalized === "LOCATION") {
    return "LOCATION";
  }

  if (normalized === "SYSTEM") {
    return "SYSTEM";
  }

  return "TEXT";
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const body = (await request.json()) as CreateMessageRequest;
    const userId = normalizeText(body.userId);
    const messageBody = normalizeText(body.body);
    const messageType = normalizeMessageType(body.messageType);
    const locationLabel = normalizeText(body.locationLabel ?? undefined);
    const latitude =
      body.latitude == null ? null : Number(body.latitude);
    const longitude =
      body.longitude == null ? null : Number(body.longitude);
    const accuracyMeters =
      body.accuracyMeters == null ? null : Number(body.accuracyMeters);
    const { conversationId } = await context.params;

    if (!userId || !conversationId) {
      return NextResponse.json(
        { message: "Faltan datos para enviar el mensaje." },
        { status: 400 },
      );
    }

    const membership = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId,
      },
      select: { id: true },
    });

    if (!membership) {
      return NextResponse.json(
        { message: "No puedes enviar mensajes en una conversación ajena." },
        { status: 403 },
      );
    }

    if (
      messageType === "TEXT" &&
      !messageBody
    ) {
      return NextResponse.json(
        { message: "El mensaje de texto no puede estar vacío." },
        { status: 400 },
      );
    }

    if (
      messageType === "LOCATION" &&
      (
        latitude == null ||
        Number.isNaN(latitude) ||
        longitude == null ||
        Number.isNaN(longitude) ||
        (accuracyMeters != null && Number.isNaN(accuracyMeters))
      )
    ) {
      return NextResponse.json(
        { message: "La ubicación requiere latitud y longitud válidas." },
        { status: 400 },
      );
    }

    const message = await prisma.$transaction(async (tx) => {
      const createdMessage = await tx.conversationMessage.create({
        data: {
          conversationId,
          senderUserId: userId,
          messageType,
          body: messageType === "TEXT" ? messageBody : messageBody || null,
          latitude:
            latitude == null ? null : new Prisma.Decimal(latitude),
          longitude:
            longitude == null ? null : new Prisma.Decimal(longitude),
          accuracyMeters:
            accuracyMeters == null
              ? null
              : new Prisma.Decimal(accuracyMeters.toFixed(2)),
          locationLabel: locationLabel || null,
        },
        select: {
          id: true,
          conversationId: true,
          senderUserId: true,
          messageType: true,
          body: true,
          latitude: true,
          longitude: true,
          accuracyMeters: true,
          locationLabel: true,
          createdAt: true,
        },
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: {
          updatedAt: new Date(),
        },
      });

      if (messageType === "LOCATION" && latitude != null && longitude != null) {
        await tx.userLastLocation.upsert({
          where: { userId },
          update: {
            latitude: new Prisma.Decimal(latitude),
            longitude: new Prisma.Decimal(longitude),
            accuracyMeters:
              accuracyMeters == null
                ? null
                : new Prisma.Decimal(accuracyMeters.toFixed(2)),
            capturedAt: new Date(),
            source: "MESSAGE_SHARE",
            sharedConversationId: conversationId,
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
            source: "MESSAGE_SHARE",
            sharedConversationId: conversationId,
          },
        });
      }

      await tx.conversationParticipant.updateMany({
        where: {
          conversationId,
          userId,
        },
        data: {
          lastReadAt: new Date(),
        },
      });

      return createdMessage;
    });

    return NextResponse.json(
      {
        message: {
          id: message.id,
          conversationId: message.conversationId,
          senderUserId: message.senderUserId,
          messageType: message.messageType,
          body: message.body,
          location:
            message.latitude != null && message.longitude != null
              ? {
                  latitude: Number(message.latitude.toString()),
                  longitude: Number(message.longitude.toString()),
                  accuracyMeters: message.accuracyMeters
                    ? Number(message.accuracyMeters.toString())
                    : null,
                  label: message.locationLabel,
                }
              : null,
          createdAt: message.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error enviando mensaje:", error);

    return NextResponse.json(
      { message: "No fue posible enviar el mensaje." },
      { status: 500 },
    );
  }
}
