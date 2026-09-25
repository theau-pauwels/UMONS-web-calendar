import { describe, expect, it } from "vitest";
import { updateWeekSnapshot } from "./browser-cache";
import type { BrowserCalendarCache, CalendarEvent } from "./types";

const event: CalendarEvent = {
  id: "a",
  uid: "a",
  title: "Cours",
  start: "2026-09-28T08:00:00.000Z",
  end: "2026-09-28T10:00:00.000Z",
  location: "",
  description: "",
  allDay: false
};

describe("updateWeekSnapshot", () => {
  it("does not notify on the first consultation of a week", () => {
    const cache: BrowserCalendarCache = { version: 1, weeks: {}, seenChangeIds: [] };
    expect(updateWeekSnapshot(cache, "2026-09-28", [event]).changes).toEqual([]);
  });

  it("compares only the requested viewed week", () => {
    const cache: BrowserCalendarCache = {
      version: 1,
      seenChangeIds: [],
      weeks: {
        "2026-09-28": {
          weekKey: "2026-09-28",
          viewedAt: "2026-09-25T00:00:00.000Z",
          events: [event]
        },
        "2026-10-05": {
          weekKey: "2026-10-05",
          viewedAt: "2026-09-25T00:00:00.000Z",
          events: []
        }
      }
    };

    const changed = { ...event, location: "2/07" };
    const result = updateWeekSnapshot(cache, "2026-09-28", [changed]);
    expect(result.changes).toHaveLength(1);
    expect(result.cache.weeks["2026-10-05"].events).toEqual([]);
  });
});
