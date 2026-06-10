"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-black text-white flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-bold mb-2 text-[#FF6B2B]">Something went wrong</h1>
          <p className="text-[#6B6966] mb-6">
            An unexpected error occurred. Our team has been notified.
          </p>
          <button
            onClick={reset}
            className="bg-[#FF6B2B] text-black font-semibold px-6 py-3 rounded-lg hover:bg-[#e55a1e] transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
