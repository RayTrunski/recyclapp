import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    conversationId: string;
  }>;
};

function normalizeText(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function formatParticipantName(user: {
  displayName: string | null;
  firstName: string;
  lastName: string | null;
  email: string;
}) {
  const fullName = `${user.firstName} ${user.lastName ?? ""}`.trim();

  return user.displayName ?? (fullName || user.email);
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = normalizeText(searchParams.get("userId"));
    const { conversationId } = await context.params;

    if (!userId || !conversationId) {
      return NextResponse.json(
        { message: "Faltan datos para cargar el detalle de la conversación." },
        { status: 400 },
      );
    }

    const membership = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId,
      },
      select: {
        lastReadAt: true,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { message: "No tienes acceso a la conversación solicitada." },
        { status: 403 },
      );
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        subject: true,
        status: true,
        createdAt: true,
        listingId: true,
        listing: {
          select: {
            id: true,
            title: true,
          },
        },
        participants: {
          select: {
            userId: true,
            lastReadAt: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                displayName: true,
                email: true,
                avatarUrl: true,
                lastKnownLocation: {
                  select: {
                    latitude: true,
                    longitude: true,
                    accuracyMeters: true,
                    capturedAt: true,
                    source: true,
                  },
                },
              },
            },
          },
        },
        messages: {
          orderBy: [{ createdAt: "asc" }],
          select: {
            id: true,
            senderUserId: true,
            messageType: true,
            body: true,
            latitude: true,
            longitude: true,
            accuracyMeters: true,
            locationLabel: true,
            createdAt: true,
            sender: {
              select: {
                displayName: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { message: "No se encontró la conversación solicitada." },
        { status: 404 },
      );
    }

    const unreadCount = conversation.messages.filter((message) => {
      if (message.senderUserId === userId) {
        return false;
      }

      if (!membership.lastReadAt) {
        return true;
      }

      return message.createdAt > membership.lastReadAt;
    }).length;

    return NextResponse.json(
      {
        conversation: {
          id: conversation.id,
          subject: conversation.subject,
          status: conversation.status,
          createdAt: conversation.createdAt.toISOString(),
          listing: conversation.listing,
          unreadCount,
          participants: conversation.participants.map((participant) => ({
            userId: participant.userId,
            name: formatParticipantName(participant.user),
            email: participant.user.email,
            avatarUrl: participant.user.avatarUrl,
            lastReadAt: participant.lastReadAt?.toISOString() ?? null,
            lastLocation: participant.user.lastKnownLocation
              ? {
                  latitude: Number(
                    participant.user.lastKnownLocation.latitude.toString(),
                  ),
                  longitude: Number(
                    participant.user.lastKnownLocation.longitude.toString(),
                  ),
                  accuracyMeters: participant.user.lastKnownLocation.accuracyMeters
                    ? Number(
                        participant.user.lastKnownLocation.accuracyMeters.toString(),
                      )
                    : null,
                  capturedAt:
                    participant.user.lastKnownLocation.capturedAt.toISOString(),
                  source: participant.user.lastKnownLocation.source,
                }
              : null,
          })),
          messages: conversation.messages.map((message) => ({
            id: message.id,
            senderUserId: message.senderUserId,
            senderName: formatParticipantName(message.sender),
            senderAvatarUrl: message.sender.avatarUrl,
            messageType: message.messageType,
            body: message.body,
            createdAt: message.createdAt.toISOString(),
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
          })),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error cargando detalle de conversación:", error);

    return NextResponse.json(
      { message: "No fue posible cargar el detalle de la conversación." },
      { status: 500 },
    );
  }
}
