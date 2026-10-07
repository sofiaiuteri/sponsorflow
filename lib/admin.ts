import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Single-owner admin: one password (ADMIN_PASSWORD) and a signed session cookie (ADMIN_SECRET).
const COOKIE = "sf_admin";
const MAX_AGE = 60 * 60 * 24 * 30;

function sign(value: string) {
  return createHmac("sha256", process.env.ADMIN_SECRET ?? "").update(value).digest("hex");
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function passwordMatches(input: string) {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  return expected.length > 0 && safeEqual(input, expected);
}

export async function startSession() {
  const expires = String(Date.now() + MAX_AGE * 1000);
  (await cookies()).set(COOKIE, `${expires}.${sign(expires)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin() {
  if (!process.env.ADMIN_SECRET) return false;
  const value = (await cookies()).get(COOKIE)?.value ?? "";
  const [expires, sig] = value.split(".");
  if (!expires || !sig || !safeEqual(sig, sign(expires))) return false;
  return Number(expires) > Date.now();
}

export async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("Not authorized");
}
