"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";

const FEATURES = [
  { icon: "🔥", text: "AI coach that remembers your history" },
  { icon: "📈", text: "Forge Score tracks real mental growth" },
  { icon: "⚡", text: "Neuroscience-backed habit streaks" },
  { icon: "🧠", text: "Daily check-ins that hold you accountable" },
];

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSession(idToken: string) {
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) throw new Error("Session error");
    const { redirectPath } = await res.json();
    router.push(redirectPath);
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const cred =
        mode === "signin"
          ? await signInWithEmailAndPassword(auth, email, password)
          : await createUserWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();
      await handleSession(idToken);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Authentication failed";
      setError(msg.replace("Firebase: ", "").replace(/\(auth\/.*\)\.?/, "").trim());
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const idToken = await cred.user.getIdToken();
      await handleSession(idToken);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Google sign-in failed";
      setError(msg.replace("Firebase: ", "").replace(/\(auth\/.*\)\.?/, "").trim());
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-forge-base flex flex-col lg:flex-row overflow-x-hidden">

      {/* ── Left brand panel (hidden on mobile, shown lg+) ── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col justify-between p-12 xl:p-16 relative overflow-hidden border-r border-forge-border">
        {/* Background texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, #FF6B2B 0px, #FF6B2B 1px, transparent 1px, transparent 60px), repeating-linear-gradient(90deg, #FF6B2B 0px, #FF6B2B 1px, transparent 1px, transparent 60px)",
          }}
        />
        {/* Orange glow */}
        <div
          className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(circle, #FF6B2B, transparent 70%)" }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <span className="font-heading text-2xl font-bold tracking-tight text-forge-orange">
            MindForge
          </span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-forge-orange">
              Mental Performance Platform
            </p>
            <h1 className="font-heading text-4xl xl:text-5xl font-bold leading-[1.08] text-text-primary">
              Rewire your brain.
              <br />
              <span className="text-forge-orange">Forge your identity.</span>
            </h1>
            <p className="text-base text-text-muted leading-relaxed max-w-md">
              The AI accountability coach that builds a persistent memory of who
              you are — and holds you to who you said you&apos;d be.
            </p>
          </div>

          {/* Feature list */}
          <ul className="space-y-3">
            {FEATURES.map((f) => (
              <li key={f.text} className="flex items-center gap-3">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center border border-forge-border bg-forge-elevated text-sm">
                  {f.icon}
                </span>
                <span className="text-sm text-text-secondary">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-xs text-text-disabled">
            &copy; {new Date().getFullYear()} MindForge. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-8 lg:px-12">

        {/* Mobile-only logo */}
        <div className="mb-8 text-center lg:hidden">
          <span className="font-heading text-2xl font-bold text-forge-orange">
            MindForge
          </span>
          <p className="mt-1.5 text-sm text-text-muted">
            Rewire your brain. Forge your identity.
          </p>
        </div>

        <div className="w-full max-w-[420px]">

          {/* Mode heading */}
          <div className="mb-7">
            <h2 className="font-heading text-2xl font-bold text-text-primary">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-1.5 text-sm text-text-muted">
              {mode === "signin"
                ? "Sign in to continue your forge."
                : "Start your mental performance journey."}
            </p>
          </div>

          <div className="space-y-4">
            {/* Google */}
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="group flex w-full items-center justify-center gap-3 border border-forge-border bg-forge-elevated px-4 py-3 min-h-[52px] text-sm font-medium text-text-primary transition-all duration-200 hover:border-forge-border-strong hover:bg-forge-overlay disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <Spinner />
              ) : (
                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
              )}
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-forge-border" />
              <span className="text-xs font-medium text-text-disabled uppercase tracking-widest">
                or
              </span>
              <div className="flex-1 border-t border-forge-border" />
            </div>

            {/* Email form */}
            <form onSubmit={handleEmailAuth} className="space-y-3" noValidate>
              <div className="space-y-1">
                <label
                  htmlFor="email"
                  className="block text-xs font-medium uppercase tracking-wider text-text-muted"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border border-forge-border bg-forge-input px-4 py-3 min-h-[48px] text-sm text-text-primary placeholder:text-text-disabled transition-colors duration-200 focus:border-forge-orange focus:outline-none focus:ring-1 focus:ring-forge-orange/30"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium uppercase tracking-wider text-text-muted"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  placeholder={mode === "signin" ? "Your password" : "Min. 6 characters"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full border border-forge-border bg-forge-input px-4 py-3 min-h-[48px] text-sm text-text-primary placeholder:text-text-disabled transition-colors duration-200 focus:border-forge-orange focus:outline-none focus:ring-1 focus:ring-forge-orange/30"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2.5 border border-red-800/40 bg-red-950/30 px-4 py-3">
                  <svg
                    className="mt-px h-4 w-4 flex-shrink-0 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-xs leading-relaxed text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 bg-forge-orange px-4 py-3 min-h-[52px] text-sm font-bold text-forge-base transition-all duration-200 hover:bg-forge-orange-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Spinner />
                    <span>{mode === "signin" ? "Signing in…" : "Creating account…"}</span>
                  </>
                ) : mode === "signin" ? (
                  "Sign In →"
                ) : (
                  "Create Account →"
                )}
              </button>
            </form>

            {/* Toggle mode */}
            <p className="text-center text-sm text-text-muted">
              {mode === "signin" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    onClick={() => { setMode("signup"); setError(""); }}
                    className="font-medium text-forge-orange transition-colors hover:text-forge-orange-hover hover:underline underline-offset-2"
                  >
                    Sign up free
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => { setMode("signin"); setError(""); }}
                    className="font-medium text-forge-orange transition-colors hover:text-forge-orange-hover hover:underline underline-offset-2"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>

          {/* Legal */}
          <p className="mt-8 text-center text-xs text-text-disabled leading-relaxed">
            By continuing, you agree to our{" "}
            <a href="/terms" className="underline underline-offset-2 hover:text-text-muted transition-colors">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="underline underline-offset-2 hover:text-text-muted transition-colors">
              Privacy Policy
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
}
