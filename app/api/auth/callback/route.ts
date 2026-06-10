import { NextResponse } from "next/server";
import { sessionCookieOptions, COOKIE_NAME } from "@/lib/auth";

export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/login`);
}
