import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    conversationId: string;
  }>;
};

type MarkReadRequest = {
  userId?: string;
};

function normalizeText(value: string | undefined) {
  return value?.trim() ?? "";
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const body = (await request.json()) as MarkReadRequest;
    const userId = normalizeText(body.userId);
    const { conversationId } = await context.params;

    if (!userId || !conversationId) {
      return NextResponse.json(
        { message: "Faltan datos para marcar la conversación como leída." },
        { status: 400 },
      );
    }

    const result = await prisma.conversationParticipant.updateMany({
      where: {
        conversationId,
        userId,
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { message: "No tienes acceso a la conversación solicitada." },
        { status: 403 },
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error marcando conversación como leída:", error);

    return NextResponse.json(
      { message: "No fue posible actualizar el estado de lectura." },
      { status: 500 },
    );
  }
}
