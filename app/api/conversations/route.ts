import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

function normalizeText(value: string | null) {
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = normalizeText(searchParams.get("userId"));

    if (!userId) {
      return NextResponse.json(
        { message: "Debes indicar el usuario para consultar conversaciones." },
        { status: 400 },
      );
    }

    const memberships = await prisma.conversationParticipant.findMany({
      where: {
        userId,
      },
      select: {
        conversationId: true,
        lastReadAt: true,
        conversation: {
          select: {
            id: true,
            subject: true,
            status: true,
            createdAt: true,
            updatedAt: true,
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
              orderBy: [{ createdAt: "desc" }],
              take: 1,
              select: {
                id: true,
                body: true,
                messageType: true,
                createdAt: true,
                senderUserId: true,
              },
            },
          },
        },
      },
    });

    const conversations = await Promise.all(
      memberships.map(async (membership) => {
        const conversation = membership.conversation;
        const lastMessage = conversation.messages[0] ?? null;
        const otherParticipant = conversation.participants.find(
          (participant) => participant.userId !== userId,
        );

        const unreadCount = await prisma.conversationMessage.count({
          where: {
            conversationId: conversation.id,
            senderUserId: { not: userId },
            createdAt: membership.lastReadAt
              ? { gt: membership.lastReadAt }
              : undefined,
          },
        });

        return {
          id: conversation.id,
          listingId: conversation.listingId,
          listingTitle: conversation.listing?.title ?? null,
          subject: conversation.subject,
          status: conversation.status,
          unreadCount,
          lastMessage: lastMessage
            ? {
                id: lastMessage.id,
                body: lastMessage.body,
                messageType: lastMessage.messageType,
                createdAt: lastMessage.createdAt.toISOString(),
                senderUserId: lastMessage.senderUserId,
              }
            : null,
          lastActivityAt: (
            lastMessage?.createdAt ??
            conversation.updatedAt ??
            conversation.createdAt
          ).toISOString(),
          otherParticipant: otherParticipant
            ? {
                id: otherParticipant.user.id,
                name: formatParticipantName(otherParticipant.user),
                email: otherParticipant.user.email,
                avatarUrl: otherParticipant.user.avatarUrl,
                lastLocation: otherParticipant.user.lastKnownLocation
                  ? {
                      latitude: Number(
                        otherParticipant.user.lastKnownLocation.latitude.toString(),
                      ),
                      longitude: Number(
                        otherParticipant.user.lastKnownLocation.longitude.toString(),
                      ),
                      accuracyMeters:
                        otherParticipant.user.lastKnownLocation.accuracyMeters
                          ? Number(
                              otherParticipant.user.lastKnownLocation.accuracyMeters.toString(),
                            )
                          : null,
                      capturedAt:
                        otherParticipant.user.lastKnownLocation.capturedAt.toISOString(),
                      source: otherParticipant.user.lastKnownLocation.source,
                    }
                  : null,
              }
            : null,
        };
      }),
    );

    conversations.sort((left, right) =>
      right.lastActivityAt.localeCompare(left.lastActivityAt),
    );

    return NextResponse.json({ conversations }, { status: 200 });
  } catch (error) {
    console.error("Error cargando conversaciones:", error);

    return NextResponse.json(
      { message: "No fue posible cargar la bandeja de conversaciones." },
      { status: 500 },
    );
  }
}
