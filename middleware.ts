import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "mf_session";

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

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
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
