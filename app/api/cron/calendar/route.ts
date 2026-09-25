import { NextRequest, NextResponse } from "next/server";
import { refreshCalendarCache } from "@/lib/calendar-source";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const text = await refreshCalendarCache();
    return NextResponse.json({ ok: true, bytes: text.length });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
