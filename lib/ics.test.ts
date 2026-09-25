import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseCalendar } from "./ics";

describe("parseCalendar", () => {
  it("normalizes simple and recurring ICS events", () => {
    const text = readFileSync(join(process.cwd(), "test/fixtures/calendar.ics"), "utf8");
    const events = parseCalendar(
      text,
      new Date("2026-09-28T00:00:00.000Z"),
      new Date("2026-10-12T00:00:00.000Z")
    );

    expect(events.some((event) => event.title === "Télécommunications")).toBe(true);
    expect(events.filter((event) => event.uid === "test-repeat")).toHaveLength(2);
    expect(events.find((event) => event.uid === "test-1")?.location).toBe("Local 1/01");
  });
});
