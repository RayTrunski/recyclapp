import { ClaimStatus, PickupStatus, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";

import { CLAIM_PICKUP_NOTE_PREFIX } from "@/lib/pickups";
import { prisma } from "@/lib/prisma";
import type { ClaimListingInput } from "@/src/types";

function normalizeText(value: string | undefined) {
  return value?.trim() ?? "";
}

function buildClaimNotes(message: string) {
  const normalizedMessage = normalizeText(message);

  if (!normalizedMessage) {
    return CLAIM_PICKUP_NOTE_PREFIX;
  }

  return `${CLAIM_PICKUP_NOTE_PREFIX} ${normalizedMessage}`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ClaimListingInput;
    const claimantId = normalizeText(body.claimantId);
    const listingId = normalizeText(body.listingId);
    const message = normalizeText(body.message);

    if (!claimantId || !listingId) {
      return NextResponse.json(
        { message: "Faltan datos para registrar la solicitud de donación." },
        { status: 400 },
      );
    }

    const listing = await prisma.listing.findFirst({
      where: {
        id: listingId,
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        ownerId: true,
        categoryId: true,
        pickupAddressId: true,
        availableFrom: true,
        owner: {
          select: {
            defaultAddressId: true,
          },
        },
        claims: {
          where: {
            status: {
              in: [ClaimStatus.PENDING, ClaimStatus.APPROVED],
            },
          },
          select: {
            id: true,
          },
          take: 1,
        },
      },
    });

    if (!listing) {
      return NextResponse.json(
        { message: "No se encontró el artículo que intentas solicitar." },
        { status: 404 },
      );
    }

    if (listing.ownerId === claimantId) {
      return NextResponse.json(
        { message: "No puedes solicitar una publicación que te pertenece." },
        { status: 400 },
      );
    }

    if (listing.claims.length > 0) {
      return NextResponse.json(
        {
          message:
            "Este artículo ya tiene una solicitud activa y no admite otra por ahora.",
        },
        { status: 409 },
      );
    }

    const pickupAddressId =
      listing.pickupAddressId ?? listing.owner.defaultAddressId ?? null;

    if (!pickupAddressId) {
      return NextResponse.json(
        {
          message:
            "La publicación no tiene un punto de entrega válido para coordinar la donación.",
        },
        { status: 400 },
      );
    }

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

    await prisma.$transaction(async (tx) => {
      await tx.listingClaim.create({
        data: {
          listingId: listing.id,
          claimantId,
          message: message || null,
          status: ClaimStatus.PENDING,
        },
      });

      await tx.pickupRequest.create({
        data: {
          listingId: listing.id,
          requesterId: claimantId,
          collectorId: assignedCollector?.id ?? null,
          pickupAddressId,
          categoryId: listing.categoryId,
          itemTitle: listing.title,
          notes: buildClaimNotes(message),
          preferredDate:
            listing.availableFrom ?? new Date("2026-07-16T12:00:00.000Z"),
          timeSlotLabel: "Por coordinar con donador",
          status: assignedCollector
            ? PickupStatus.ASSIGNED
            : PickupStatus.REQUESTED,
        },
      });

      const conversation = await tx.conversation.create({
        data: {
          listingId: listing.id,
          createdByUserId: claimantId,
          subject: `Solicitud sobre ${listing.title}`,
        },
        select: {
          id: true,
        },
      });

      await tx.conversationParticipant.createMany({
        data: [
          {
            conversationId: conversation.id,
            userId: claimantId,
            lastReadAt: new Date(),
          },
          {
            conversationId: conversation.id,
            userId: listing.ownerId,
          },
        ],
      });

      await tx.conversationMessage.create({
        data: {
          conversationId: conversation.id,
          senderUserId: claimantId,
          messageType: message ? "TEXT" : "SYSTEM",
          body:
            message ||
            "Hola, me interesa esta publicación y quiero coordinar la entrega.",
        },
      });
    });

    return NextResponse.json(
      {
        message:
          "Solicitud de donación registrada. Ya puedes monitorearla en Recolecciones.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creando solicitud de donación:", error);

    return NextResponse.json(
      {
        message:
          "No fue posible registrar la solicitud de donación en este momento.",
      },
      { status: 500 },
    );
  }
}
