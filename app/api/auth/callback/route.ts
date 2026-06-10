import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { users } from "@/shared/schema";
import {
  createSessionToken,
  sessionCookieOptions,
  COOKIE_NAME,
} from "@/lib/auth";

const ISSUER = "https://replit.com/oidc";

function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [k, ...v] = c.trim().split("=");
      return [k, decodeURIComponent(v.join("="))];
    })
  );
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const cookieHeader = request.headers.get("cookie");
  const raw = parseCookies(cookieHeader);
  const storedState = raw["oauth_state"];
  const verifier = raw["pkce_verifier"];

  if (!code || !state || state !== storedState || !verifier) {
    return NextResponse.redirect(`${origin}/login?error=auth_error`);
  }

  try {
    const configRes = await fetch(
      `${ISSUER}/.well-known/openid-configuration`
    );
    const config = await configRes.json();

    const tokenRes = await fetch(config.token_endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.REPL_ID!,
        code,
        redirect_uri: `${origin}/api/auth/callback`,
        code_verifier: verifier,
      }),
    });

    if (!tokenRes.ok) throw new Error("Token exchange failed");
    const tokens = await tokenRes.json();

    const userInfoRes = await fetch(config.userinfo_endpoint, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userInfo = await userInfoRes.json();

    const userId: string = String(userInfo.sub);
    const email: string = userInfo.email ?? `${userId}@replit.user`;

    await db
      .insert(users)
      .values({ id: userId, email, displayName: userInfo.name ?? null })
      .onConflictDoUpdate({
        target: users.id,
        set: { email, updatedAt: new Date() },
      });

    const [profile] = await db
      .select({
        onboardingComplete: users.onboardingComplete,
        onboardingStep: users.onboardingStep,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const redirectPath =
      !profile?.onboardingComplete
        ? `/onboarding/${profile?.onboardingStep ?? "mirror"}`
        : "/dashboard";

    const token = await createSessionToken({ id: userId, email });
    const response = NextResponse.redirect(`${origin}${redirectPath}`);
    response.cookies.set(COOKIE_NAME, token, sessionCookieOptions());
    response.cookies.delete("pkce_verifier");
    response.cookies.delete("oauth_state");
    return response;
  } catch (err) {
    console.error("Callback error:", err);
    return NextResponse.redirect(`${origin}/login?error=auth_error`);
  }
}
