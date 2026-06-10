"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setMagicSent(true);
    }
  }

  async function handleGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-forge-base px-4">
      <div className="w-full max-w-[400px]">
        {/* Logotype */}
        <div className="mb-8 text-center">
          <span className="font-heading text-2xl font-bold text-forge-orange">
            MindForge
          </span>
          <p className="mt-2 text-sm text-text-muted">
            Rewire your brain. Forge your identity.
          </p>
        </div>

        {magicSent ? (
          <div className="border border-forge-border bg-forge-elevated px-6 py-8 text-center">
            <p className="text-base text-text-primary">
              Magic link sent! Check your email.
            </p>
            <p className="mt-2 text-sm text-text-muted">
              Click the link in your inbox to sign in.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Magic link form */}
            <form onSubmit={handleMagicLink} className="space-y-3">
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-forge-border bg-forge-input px-4 py-3 text-sm text-text-primary placeholder-text-muted outline-none transition focus:border-forge-orange focus:ring-1 focus:ring-forge-orange"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-forge-orange px-4 py-3 text-sm font-medium text-forge-base transition hover:bg-forge-orange-hover disabled:opacity-50"
              >
                {loading ? "Sending…" : "Send Magic Link"}
              </button>
            </form>

            {error && (
              <p className="text-center text-xs text-red-400">{error}</p>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-forge-border" />
              <span className="text-xs text-text-muted">or</span>
              <div className="h-px flex-1 bg-forge-border" />
            </div>

            {/* Google OAuth */}
            <button
              type="button"
              onClick={handleGoogle}
              className="flex w-full items-center justify-center gap-3 border border-forge-border bg-transparent px-4 py-3 text-sm text-text-primary transition hover:border-forge-border-strong hover:bg-forge-elevated"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z"
                  fill="#4285F4"
                />
                <path
                  d="M9 18c2.43 0 4.4673-.8055 5.9564-2.1805l-2.9087-2.2581c-.8055.54-1.8368.8591-3.0477.8591-2.3441 0-4.3282-1.5832-5.036-3.7105H.9574v2.3318C2.4382 15.9832 5.4818 18 9 18z"
                  fill="#34A853"
                />
                <path
                  d="M3.964 10.71c-.18-.54-.2827-1.1168-.2827-1.71s.1018-1.17.2827-1.71V4.9582H.9574C.3477 6.1732 0 7.5482 0 9s.3477 2.8268.9574 4.0418L3.964 10.71z"
                  fill="#FBBC05"
                />
                <path
                  d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.4259 0 9 0 5.4818 0 2.4382 2.0168.9574 4.9582L3.964 7.29C4.6718 5.1627 6.6559 3.5795 9 3.5795z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
