import { describe, expect, it } from "vitest";
import { diffEvents } from "./diff";
import type { CalendarEvent } from "./types";

const base: CalendarEvent = {
  id: "uid-1:2026-09-28T08:00:00.000Z",
  uid: "uid-1",
  title: "Télécommunications",
  start: "2026-09-28T08:00:00.000Z",
  end: "2026-09-28T10:00:00.000Z",
  location: "1/01",
  description: "",
  allDay: false
};

describe("diffEvents", () => {
  it("detects an added event", () => {
    expect(diffEvents([], [base])[0].type).toBe("added");
  });

  it("detects a removed event", () => {
    expect(diffEvents([base], [])[0].type).toBe("removed");
  });

  it("detects time changes", () => {
    const changed = { ...base, start: "2026-09-28T09:00:00.000Z" };
    expect(diffEvents([base], [changed])[0].type).toBe("moved");
  });

  it("detects location changes", () => {
    const changed = { ...base, location: "2/07" };
    const result = diffEvents([base], [changed])[0];
    expect(result.type).toBe("updated");
    expect(result.fields).toContain("location");
  });

  it("does not report unchanged events", () => {
    expect(diffEvents([base], [{ ...base }])).toEqual([]);
  });
});
