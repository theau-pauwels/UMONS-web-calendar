import { del, list, put } from "@vercel/blob";

const BLOB_PATH = "config/course-aliases.json";

export type CourseAliases = Record<string, string>;

export async function getCourseAliases(): Promise<CourseAliases> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return {};
  try {
    const result = await list({ prefix: BLOB_PATH, limit: 10 });
    const blob = result.blobs
      .filter((item) => item.pathname === BLOB_PATH)
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())[0];
    if (!blob) return {};
    const response = await fetch(blob.url, { cache: "no-store" });
    if (!response.ok) return {};
    return await response.json();
  } catch {
    return {};
  }
}

export async function saveCourseAliases(aliases: CourseAliases) {
  const existing = await list({ prefix: BLOB_PATH, limit: 100 });
  await Promise.all(existing.blobs.map((blob) => del(blob.url)));

  await put(BLOB_PATH, JSON.stringify(aliases, null, 2), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json",
    allowOverwrite: true,
    cacheControlMaxAge: 60
  });
}

export function applyCourseAliases<T extends { title: string }>(
  events: T[],
  aliases: CourseAliases
): T[] {
  return events.map((event) => ({
    ...event,
    title: aliases[event.title.trim()]?.trim() || event.title
  }));
}
