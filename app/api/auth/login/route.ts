import { NextResponse } from "next/server";

import { loginWithCredentials } from "@/lib/auth/login";
import { ensureSupabaseAuthUser } from "@/lib/auth/supabase-user";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await loginWithCredentials(body);

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
      { status: 200 },
    );
  } catch (error) {
    console.error("Error en login:", error);

    return NextResponse.json(
      {
        success: false,
        message: "No fue posible procesar el inicio de sesión.",
      },
      { status: 500 },
    );
  }
}
