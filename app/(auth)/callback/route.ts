import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  return NextResponse.redirect(`${origin}/api/auth/callback?${searchParams}`);
}
