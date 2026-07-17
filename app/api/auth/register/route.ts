import { NextResponse } from "next/server";

import { registerUser } from "@/lib/auth/register";
import { ensureSupabaseAuthUser } from "@/lib/auth/supabase-user";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await registerUser(body);

    if ("message" in result) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: result.status },
      );
    }

    const realtime = await ensureSupabaseAuthUser({
      appUserId: result.user.id,
      email: result.user.email,
      password: typeof body?.password === "string" ? body.password : "",
      existingAuthUserId: result.user.supabaseAuthUserId,
    });

    return NextResponse.json(
      {
        success: true,
        user: result.user,
        realtimeEnabled: realtime.enabled,
        realtimeMessage: realtime.message,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error en registro:", error);

    return NextResponse.json(
      {
        success: false,
        message: "No fue posible crear la cuenta en este momento.",
      },
      { status: 500 },
    );
  }
}
