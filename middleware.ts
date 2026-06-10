import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { COOKIE_NAME } from "@/lib/auth";

const PROTECTED_PATHS = [
  "/dashboard",
  "/habits",
  "/checkin",
  "/coach",
  "/cookie-jar",
  "/challenges",
  "/analytics",
  "/settings",
  "/upgrade",
  "/onboarding",
];

const getSecret = () =>
  new TextEncoder().encode(
    process.env.SESSION_SECRET ?? "fallback-dev-secret-32chars!!!"
  );

async function getUserFromCookies(
  request: NextRequest
): Promise<{ id: string } | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return { id: payload.id as string };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const user = await getUserFromCookies(request);

  if (!user) {
    const isProtected = PROTECTED_PATHS.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`)
    );
    if (isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|api/billing/webhook).*)",
  ],
};
