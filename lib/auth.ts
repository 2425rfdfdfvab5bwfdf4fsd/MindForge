import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const COOKIE_NAME = "mf_session";

const getSecret = () =>
  new TextEncoder().encode(process.env.SESSION_SECRET ?? "fallback-dev-secret-32chars!!!");

export interface SessionUser {
  id: string;
  email?: string;
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ id: user.id, email: user.email ?? "" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, getSecret());
    return { id: payload.id as string, email: payload.email as string };
  } catch {
    return null;
  }
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
    const { payload } = await jwtVerify(token, getSecret());
    return { id: payload.id as string, email: payload.email as string };
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  };
}
