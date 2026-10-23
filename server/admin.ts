// ── AGENT-OWNED: the Studio's password gate ──────────────────────────────────
// The video's admin dashboard sits behind a single store password (NIVO555).
// There is no user account for it: the password is compared server-side against
// the owner's config (env ADMIN_PASSWORD, defaulting to NIVO555) and a signed,
// httpOnly cookie is issued. The password itself is never stored client-side and
// never echoed back.
import type { Context } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { SignJWT, jwtVerify } from "jose";
import { timingSafeEqual } from "node:crypto";
import {
  requestIsSecure,
  sessionCookieClearOptions,
  sessionCookieOptions,
} from "./_core/session-cookie";

const COOKIE = "nivo_admin";
const SUBJECT = "nivo-admin";

// `_core/env` validates its required variables at MODULE LOAD, so a static
// import here would make every importer of this file throw when DATABASE_URL /
// JWT_SECRET are unset — including the frozen `_core/test-caller.test.ts`, which
// mocks ./db, ./auth and ./storage but not ./env. Loading it lazily keeps the
// sanctioned accessor while only paying that cost on a real request.
let envModule: Promise<typeof import("./_core/env")> | undefined;
function loadEnv() {
  envModule ??= import("./_core/env");
  return envModule;
}

async function secretKey(): Promise<Uint8Array> {
  const { env } = await loadEnv();
  return new TextEncoder().encode(env.jwtSecret);
}

/** The store password. Read where it is used, never at module top level. */
export async function adminPassword(): Promise<string> {
  const { env } = await loadEnv();
  return env.config("ADMIN_PASSWORD", "NIVO555");
}

/** Constant-time compare so a wrong password cannot be probed by timing. */
export async function passwordMatches(candidate: string): Promise<boolean> {
  const a = Buffer.from(candidate);
  const b = Buffer.from(await adminPassword());
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** True when the request carries a valid, unexpired admin cookie. */
export async function isAdmin(c: Context): Promise<boolean> {
  const token = getCookie(c, COOKIE);
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, await secretKey());
    return payload.sub === SUBJECT;
  } catch {
    return false; // expired / tampered / wrong key → not an admin
  }
}

export async function setAdminSession(c: Context): Promise<void> {
  const { env } = await loadEnv();
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(SUBJECT)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(await secretKey());
  setCookie(c, COOKIE, token, sessionCookieOptions(env.isProd || requestIsSecure(c)));
}

export function clearAdminSession(c: Context): void {
  for (const opt of sessionCookieClearOptions()) deleteCookie(c, COOKIE, opt);
}
