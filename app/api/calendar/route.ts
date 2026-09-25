import { NextRequest, NextResponse } from "next/server";
import { getCalendarText } from "@/lib/calendar-source";
import { parseCalendar } from "@/lib/ics";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const fromRaw = request.nextUrl.searchParams.get("from");
  const toRaw = request.nextUrl.searchParams.get("to");

  if (!fromRaw || !toRaw) {
    return NextResponse.json({ error: "Missing from/to" }, { status: 400 });
  }

  const from = new Date(fromRaw);
  const to = new Date(toRaw);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to <= from) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }

  try {
    const ics = await getCalendarText();
    const events = parseCalendar(ics, from, to);
    return NextResponse.json(
      { events, fetchedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=86400" } }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Calendar temporarily unavailable" },
      { status: 503 }
    );
  }
}
