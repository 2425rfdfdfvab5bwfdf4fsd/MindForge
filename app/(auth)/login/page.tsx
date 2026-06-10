"use client";

export default function LoginPage() {
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

        <div className="border border-forge-border bg-forge-elevated px-6 py-8 text-center space-y-6">
          <div>
            <p className="text-sm text-text-muted mb-4">
              Sign in with your Replit account to get started.
            </p>
            <a
              href="/api/auth/login"
              className="flex w-full items-center justify-center gap-3 bg-forge-orange px-4 py-3 text-sm font-medium text-forge-base transition hover:bg-forge-orange-hover"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              Continue with Replit
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
