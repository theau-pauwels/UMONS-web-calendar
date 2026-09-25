import { get, put } from "@vercel/blob";

const BLOB_PATH = "config/course-aliases.json";

export type CourseAliases = Record<string, string>;

export async function getCourseAliases(): Promise<CourseAliases> {
  try {
    const result = await get(BLOB_PATH, {
      access: "private",
      useCache: false
    });
    if (!result) return {};
    return await new Response(result.stream).json();
  } catch {
    return {};
  }
}

export async function saveCourseAliases(aliases: CourseAliases) {
  await put(BLOB_PATH, JSON.stringify(aliases, null, 2), {
    access: "private",
    addRandomSuffix: false,
    contentType: "application/json",
    allowOverwrite: true
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
