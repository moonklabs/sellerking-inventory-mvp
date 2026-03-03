import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ data: { ok: true }, error: null });
  response.cookies.set("session_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });
  return response;
}
