import { NextRequest, NextResponse } from "next/server";
import { createSessionToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (password !== process.env.APP_PASSWORD) {
    return NextResponse.json(
      { error: { message: "비밀번호가 틀렸습니다" } },
      { status: 401 }
    );
  }

  const token = createSessionToken();

  const response = NextResponse.json({ data: { ok: true }, error: null });
  response.cookies.set("session_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7, // 7일
    path: "/",
  });

  return response;
}
