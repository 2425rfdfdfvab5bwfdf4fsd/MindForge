import "server-only";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";

export const COOKIE_NAME = "mf_session";

export interface SessionUser {
  id: string;
  email?: string;
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const decoded = await adminAuth.verifySessionCookie(token, true);
    return { id: decoded.uid, email: decoded.email };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  return getSession();
}

export async function getSessionFromRequest(
  request: Request
): Promise<SessionUser | null> {
  try {
    const cookieHeader = request.headers.get("cookie");
    if (!cookieHeader) return null;
    const match = cookieHeader
      .split(";")
      .map((c) => c.trim().split("="))
      .find(([k]) => k === COOKIE_NAME);
    if (!match) return null;
    const token = decodeURIComponent(match.slice(1).join("="));
    const decoded = await adminAuth.verifySessionCookie(token, true);
    return { id: decoded.uid, email: decoded.email };
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 14 * 24 * 60 * 60, // 14 days per spec
    path: "/",
  };
}
