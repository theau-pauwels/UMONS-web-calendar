import { createHash, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "umons_admin_session";

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

export function adminConfigured() {
  return Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET);
}

export function validAdminCredentials(username: string, password: string) {
  const expectedUser = process.env.ADMIN_USERNAME || "";
  const expectedPassword = process.env.ADMIN_PASSWORD || "";
  if (!expectedUser || !expectedPassword) return false;

  const a = digest(`${username}\0${password}`);
  const b = digest(`${expectedUser}\0${expectedPassword}`);
  return timingSafeEqual(a, b);
}

export function expectedSessionToken() {
  const secret = process.env.ADMIN_SESSION_SECRET || "";
  const username = process.env.ADMIN_USERNAME || "";
  return createHash("sha256").update(`${username}\0${secret}`).digest("hex");
}

export function validSession(token?: string) {
  if (!token || !adminConfigured()) return false;
  const expected = expectedSessionToken();
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
