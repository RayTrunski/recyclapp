import { NextResponse } from "next/server";

import { loginWithCredentials } from "@/lib/auth/login";

export async function POST(request: Request) {
  try {
    const result = await loginWithCredentials(await request.json());

    if ("message" in result) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: result.status },
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: result.user,
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
