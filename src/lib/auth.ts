import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Single-owner password login for the dashboard. The session cookie holds an
// HMAC of the password, so changing ADMIN_PASSWORD signs everyone out.

export const SESSION_COOKIE = "pinecrest_admin";

function password() {
  const value = process.env.ADMIN_PASSWORD;
  if (!value) throw new Error("ADMIN_PASSWORD is not set");
  return value;
}

export function sessionToken() {
  return createHmac("sha256", password()).update("pinecrest-admin-v1").digest("hex");
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function checkPassword(attempt: string) {
  return safeEqual(attempt, password());
}

export async function isAdmin() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return !!token && safeEqual(token, sessionToken());
}

// Call at the top of every dashboard page and server action.
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/dashboard/login");
}
