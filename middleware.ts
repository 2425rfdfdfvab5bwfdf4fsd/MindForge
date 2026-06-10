import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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
];

export async function middleware(request: NextRequest) {
  // If Supabase isn't configured yet, pass all requests through
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  // No session → guard protected routes
  if (!user) {
    const isProtected = PROTECTED_PATHS.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`)
    );
    if (isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Has session → redirect away from /login
  if (pathname === "/login") {
    const { data: profile } = await supabase
      .from("users")
      .select("onboarding_complete, onboarding_step")
      .eq("id", user.id)
      .single();

    const url = request.nextUrl.clone();
    if (!profile?.onboarding_complete) {
      url.pathname = `/onboarding/${profile?.onboarding_step ?? "mirror"}`;
    } else {
      url.pathname = "/dashboard";
    }
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/billing/webhook).*)",
  ],
};
