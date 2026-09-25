import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, validSession } from "@/lib/admin-auth";
import { getCourseAliases, saveCourseAliases } from "@/lib/course-aliases";

function authorized(request: NextRequest) {
  return validSession(request.cookies.get(ADMIN_COOKIE)?.value);
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ aliases: await getCourseAliases() });
}

export async function PUT(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const aliases = body?.aliases;
  if (!aliases || typeof aliases !== "object" || Array.isArray(aliases)) {
    return NextResponse.json({ error: "Format invalide" }, { status: 400 });
  }

  const clean = Object.fromEntries(
    Object.entries(aliases)
      .filter(([source, alias]) => source.trim() && typeof alias === "string" && alias.trim())
      .map(([source, alias]) => [source.trim(), (alias as string).trim()])
  );

  await saveCourseAliases(clean);
  return NextResponse.json({ ok: true, aliases: clean });
}
