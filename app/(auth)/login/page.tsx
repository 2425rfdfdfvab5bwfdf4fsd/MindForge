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
    <div className="flex min-h-screen items-center justify-center bg-forge-base px-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <span className="font-heading text-2xl font-bold text-forge-orange">
            MindForge
          </span>
          <p className="mt-2 text-sm text-text-muted">
            Rewire your brain. Forge your identity.
          </p>
        </div>

        <div className="border border-forge-border bg-forge-elevated px-6 py-8 space-y-5">
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 border border-forge-border bg-forge-base px-4 py-3 min-h-[52px] text-sm font-medium text-text-primary transition hover:bg-forge-elevated disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-forge-border" />
            <span className="text-xs text-text-muted">or</span>
            <div className="flex-1 border-t border-forge-border" />
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-forge-border bg-forge-base px-3 py-3 min-h-[48px] text-sm text-text-primary placeholder:text-text-muted focus:border-forge-orange focus:outline-none"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border border-forge-border bg-forge-base px-3 py-3 min-h-[48px] text-sm text-text-primary placeholder:text-text-muted focus:border-forge-orange focus:outline-none"
            />

            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center bg-forge-orange px-4 py-3 min-h-[52px] text-sm font-medium text-forge-base transition hover:bg-forge-orange-hover disabled:opacity-50"
            >
              {loading
                ? "..."
                : mode === "signin"
                ? "Sign In"
                : "Create Account"}
            </button>
          </form>

          <p className="text-center text-xs text-text-muted">
            {mode === "signin" ? (
              <>
                No account?{" "}
                <button
                  onClick={() => setMode("signup")}
                  className="text-forge-orange hover:underline"
                >
                  Sign up free
                </button>
              </>
            ) : (
              <>
                Already have one?{" "}
                <button
                  onClick={() => setMode("signin")}
                  className="text-forge-orange hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
