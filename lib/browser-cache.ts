import type {
  BrowserCalendarCache,
  CalendarChange,
  CalendarEvent,
  WeekSnapshot
} from "./types";
import { diffEvents } from "./diff";

const KEY = "umons-calendar-cache-v1";
const VERSION = 1 as const;

function emptyCache(): BrowserCalendarCache {
  return { version: VERSION, weeks: {}, seenChangeIds: [] };
}

export function loadBrowserCache(): BrowserCalendarCache {
  if (typeof window === "undefined") return emptyCache();
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!parsed || parsed.version !== VERSION) return emptyCache();
    return parsed;
  } catch {
    return emptyCache();
  }
}

export function saveBrowserCache(cache: BrowserCalendarCache) {
  localStorage.setItem(KEY, JSON.stringify(cache));
}

export function updateWeekSnapshot(
  cache: BrowserCalendarCache,
  weekKey: string,
  events: CalendarEvent[]
): { cache: BrowserCalendarCache; changes: CalendarChange[] } {
  const previous = cache.weeks[weekKey];
  const changes = previous ? diffEvents(previous.events, events) : [];
  const snapshot: WeekSnapshot = {
    weekKey,
    viewedAt: new Date().toISOString(),
    events
  };

  return {
    changes,
    cache: {
      ...cache,
      weeks: { ...cache.weeks, [weekKey]: snapshot }
    }
  };
}
