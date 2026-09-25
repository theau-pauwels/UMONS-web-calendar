import type { CalendarChange, CalendarEvent } from "./types";

function comparable(event: CalendarEvent) {
  return {
    title: event.title,
    start: event.start,
    end: event.end,
    location: event.location,
    description: event.description,
    allDay: event.allDay
  };
}

function stableChangeId(change: Omit<CalendarChange, "id">) {
  return JSON.stringify({
    type: change.type,
    before: change.before ? comparable(change.before) : null,
    after: change.after ? comparable(change.after) : null,
    fields: change.fields || []
  });
}

export function diffEvents(
  beforeEvents: CalendarEvent[],
  afterEvents: CalendarEvent[]
): CalendarChange[] {
  const before = new Map(beforeEvents.map((event) => [event.id, event]));
  const after = new Map(afterEvents.map((event) => [event.id, event]));
  const changes: CalendarChange[] = [];

  for (const [id, oldEvent] of before) {
    const next = after.get(id);
    if (!next) {
      const change = { type: "removed" as const, before: oldEvent };
      changes.push({ ...change, id: stableChangeId(change) });
      continue;
    }

    const fields = (["title", "start", "end", "location", "description"] as const)
      .filter((field) => oldEvent[field] !== next[field]);

    if (fields.length) {
      const moved = fields.includes("start") || fields.includes("end");
      const change = {
        type: moved ? ("moved" as const) : ("updated" as const),
        before: oldEvent,
        after: next,
        fields: [...fields]
      };
      changes.push({ ...change, id: stableChangeId(change) });
    }
  }

  for (const [id, next] of after) {
    if (!before.has(id)) {
      const change = { type: "added" as const, after: next };
      changes.push({ ...change, id: stableChangeId(change) });
    }
  }

  return changes;
}
