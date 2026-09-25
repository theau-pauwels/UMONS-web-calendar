import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, validSession } from "@/lib/admin-auth";
import { getCalendarText } from "@/lib/calendar-source";
import { parseCalendar } from "@/lib/ics";
import { getCourseAliases } from "@/lib/course-aliases";

export async function GET(request: NextRequest) {
  if (!validSession(request.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const from = new Date(now);
  from.setMonth(from.getMonth() - 6);
  const to = new Date(now);
  to.setMonth(to.getMonth() + 12);

  const events = parseCalendar(await getCalendarText(), from, to);
  const aliases = await getCourseAliases();
  const titles = Array.from(new Set(events.map((event) => event.title.trim()).filter(Boolean))).sort();
  return NextResponse.json({ titles, aliases });
}
