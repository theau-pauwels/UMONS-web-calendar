import ical from "node-ical";
import type { CalendarEvent } from "./types";

const TZ = "Europe/Brussels";

function asIso(date: Date) {
  return new Date(date).toISOString();
}

function textValue(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (value == null) return fallback;

  if (typeof value === "object") {
    const candidate = value as { val?: unknown; value?: unknown };
    if (typeof candidate.val === "string") return candidate.val;
    if (typeof candidate.value === "string") return candidate.value;
  }

  return fallback;
}

export function parseCalendar(
  icsText: string,
  from: Date,
  to: Date
): CalendarEvent[] {
  const parsed = ical.sync.parseICS(icsText);
  const result: CalendarEvent[] = [];

  for (const entry of Object.values(parsed)) {
    if (!entry || entry.type !== "VEVENT") continue;

    const event = entry as ical.VEvent;
    const duration = event.end.getTime() - event.start.getTime();
    const base = {
      uid: String(event.uid || ""),
      title: textValue(event.summary, "Sans titre"),
      location: textValue(event.location),
      description: textValue(event.description),
      allDay: Boolean(event.datetype === "date")
    };

    if (event.rrule) {
      const occurrences = event.rrule.between(from, to, true);
      for (const occurrence of occurrences) {
        const recurrenceKey = occurrence.toISOString();
        const override = event.recurrences?.[recurrenceKey];
        if (override) {
          result.push({
            ...base,
            id: `${base.uid}:${recurrenceKey}`,
            title: textValue(override.summary, base.title),
            location: textValue(override.location, base.location),
            description: textValue(override.description, base.description),
            start: asIso(override.start),
            end: asIso(override.end),
            allDay: Boolean(override.datetype === "date")
          });
          continue;
        }

        if (event.exdate?.[recurrenceKey]) continue;
        result.push({
          ...base,
          id: `${base.uid}:${recurrenceKey}`,
          start: asIso(occurrence),
          end: asIso(new Date(occurrence.getTime() + duration))
        });
      }
    } else if (event.start < to && event.end > from) {
      result.push({
        ...base,
        id: base.uid || `${event.start.toISOString()}:${base.title}`,
        start: asIso(event.start),
        end: asIso(event.end)
      });
    }
  }

  return result
    .filter((event) => new Date(event.start) < to && new Date(event.end) > from)
    .sort((a, b) => a.start.localeCompare(b.start));
}

export { TZ };
