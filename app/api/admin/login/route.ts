import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  adminConfigured,
  expectedSessionToken,
  validAdminCredentials
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!adminConfigured()) {
    return NextResponse.json({ error: "Admin non configuré" }, { status: 503 });
  }

  const { username, password } = await request.json();
  if (!validAdminCredentials(String(username || ""), String(password || ""))) {
    return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, expectedSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 12
  });
  return response;
}
