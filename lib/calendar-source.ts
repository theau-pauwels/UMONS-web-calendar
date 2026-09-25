import { unstable_cache, revalidateTag } from "next/cache";

const DEFAULT_ICS_URL =
  "https://ical.umons.ac.be/E8CDD7DC-30FF-4A2A-B78A-BF4EDBD0EE45.ics";

async function fetchCalendarTextUncached(): Promise<string> {
  const url = process.env.ICS_URL || DEFAULT_ICS_URL;
  const response = await fetch(url, {
    headers: { Accept: "text/calendar,text/plain;q=0.9,*/*;q=0.1" },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Calendar upstream returned ${response.status}`);
  }

  return response.text();
}

export const getCalendarText = unstable_cache(
  fetchCalendarTextUncached,
  ["umons-calendar-source"],
  { revalidate: 60 * 60 * 24, tags: ["umons-calendar"] }
);

export async function refreshCalendarCache() {
  revalidateTag("umons-calendar");
  return getCalendarText();
}
