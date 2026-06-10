import { NextResponse } from "next/server";

const ISSUER = "https://replit.com/oidc";

function base64url(buf: Uint8Array): string {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

async function getPKCE() {
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier)
  );
  const challenge = base64url(new Uint8Array(digest));
  return { verifier, challenge };
}

export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  try {
    const res = await fetch(`${ISSUER}/.well-known/openid-configuration`);
    const config = await res.json();
    const { verifier, challenge } = await getPKCE();
    const state = base64url(crypto.getRandomValues(new Uint8Array(16)));

    const params = new URLSearchParams({
      response_type: "code",
      client_id: process.env.REPL_ID!,
      redirect_uri: `${origin}/api/auth/callback`,
      scope: "openid email profile",
      state,
      code_challenge: challenge,
      code_challenge_method: "S256",
    });

    const response = NextResponse.redirect(
      `${config.authorization_endpoint}?${params}`
    );
    response.cookies.set("pkce_verifier", verifier, {
      httpOnly: true,
      maxAge: 600,
      path: "/",
      sameSite: "lax",
    });
    response.cookies.set("oauth_state", state, {
      httpOnly: true,
      maxAge: 600,
      path: "/",
      sameSite: "lax",
    });
    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.redirect(`${origin}/login?error=server_error`);
  }
}
