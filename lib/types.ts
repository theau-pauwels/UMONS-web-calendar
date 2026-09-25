export type CalendarEvent = {
  id: string;
  uid: string;
  title: string;
  start: string;
  end: string;
  location: string;
  description: string;
  allDay: boolean;
};

export type CalendarChange = {
  id: string;
  type: "added" | "removed" | "moved" | "updated";
  before?: CalendarEvent;
  after?: CalendarEvent;
  fields?: string[];
};

export type WeekSnapshot = {
  weekKey: string;
  viewedAt: string;
  events: CalendarEvent[];
};

export type BrowserCalendarCache = {
  version: 1;
  weeks: Record<string, WeekSnapshot>;
  seenChangeIds: string[];
};
