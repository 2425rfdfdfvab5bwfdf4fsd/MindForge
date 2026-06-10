"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/trpc/client";
import { useStreamingResponse } from "@/lib/hooks/useStreamingResponse";

const MIN_CHARS = 100;

function PulsingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block h-1.5 w-1.5 rounded-full bg-forge-orange"
          style={{
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </span>
  );
}

export default function MirrorPage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [checkinId, setCheckinId] = useState<string | null>(null);
  const [showResponse, setShowResponse] = useState(false);
  const [waitingForFirst, setWaitingForFirst] = useState(false);
  const responseRef = useRef<HTMLDivElement>(null);

  const { streamedText, isStreaming, isComplete, error, startStream } =
    useStreamingResponse();

  // tRPC mutations
  const submitCheckin = api.checkins.submit.useMutation();
  const updateMetadata = api.checkins.updateMetadata.useMutation();
  const updateProfile = api.user.updateProfile.useMutation();

  // Redirect if already past this step
  const { data: profile } = api.user.getProfile.useQuery(undefined, {
    retry: false,
  });

  useEffect(() => {
    if (profile && profile.onboardingStep !== "mirror") {
      router.replace("/onboarding/why");
    }
  }, [profile, router]);

  // Once streaming starts, hide the pulsing dots
  useEffect(() => {
    if (streamedText.length > 0 && waitingForFirst) {
      setWaitingForFirst(false);
    }
  }, [streamedText, waitingForFirst]);

  // Scroll response area into view after it appears
  useEffect(() => {
    if (showResponse) {
      setTimeout(
        () => responseRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
        100
      );
    }
  }, [showResponse]);

  // After stream completes, save the AI response to the checkin
  useEffect(() => {
    if (isComplete && streamedText && checkinId) {
      updateMetadata.mutate({
        checkinId: checkinId,
        aiResponse: streamedText,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete, checkinId]);

  async function handleSubmit() {
    if (text.length < MIN_CHARS || submitted) return;
    setSubmitted(true);

    const localDate = new Date().toISOString().split("T")[0];

    // Store checkin
    const result = await submitCheckin.mutateAsync({
      localDate,
      text,
      onboardingMirror: true,
    });

    if (result && typeof result === "object" && "id" in result) {
      setCheckinId((result as { id: string }).id);
    }

    // Show response area and start streaming
    setShowResponse(true);
    setWaitingForFirst(true);

    await startStream("/api/coach/stream", {
      session_type: "onboarding_mirror",
      messages: [
        {
          role: "user",
          parts: [{ text }],
        },
      ],
      context: {},
    });
  }

  async function handleContinue() {
    await updateProfile.mutateAsync({
      onboardingStep: "why",
    });
    router.push("/onboarding/why");
  }

  const charCount = text.length;
  const canSubmit = charCount >= MIN_CHARS && !submitted;

  return (
    <div className="flex min-h-screen flex-col bg-forge-base px-6 py-12">
      <div className="mx-auto w-full max-w-[720px]">
        {/* Breadcrumb */}
        <p className="mb-4 text-xs tracking-widest text-text-muted uppercase">
          Step 1 of 3
        </p>

        {/* Heading */}
        <h1 className="font-heading text-4xl font-bold text-text-primary">
          Face the Mirror
        </h1>
        <p className="mt-4 max-w-[560px] text-base text-text-secondary">
          Write the truth about where you are right now. Your failures. Your
          excuses. Your wasted potential. Don't filter it.
        </p>

        {/* Textarea */}
        <div className="mt-10">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={submitted}
            placeholder="Start writing..."
            className="w-full border border-forge-border bg-forge-input p-5 text-base text-text-primary placeholder-text-disabled outline-none transition focus:border-forge-orange focus:ring-1 focus:ring-forge-orange disabled:opacity-60"
            style={{
              minHeight: "clamp(200px, 50vh, 60vh)",
              resize: "vertical",
              lineHeight: "1.65",
              fontFamily: "inherit",
            }}
          />

          {/* Character count */}
          <div className="mt-2 flex justify-end">
            <span
              className={`text-xs tabular-nums ${
                charCount >= MIN_CHARS ? "text-forge-orange" : "text-text-muted"
              }`}
            >
              {charCount} / {MIN_CHARS} min
            </span>
          </div>
        </div>

        {/* Submit button */}
        {!submitted && (
          <div className="relative mt-6">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="group relative w-full overflow-hidden bg-forge-orange py-4 font-heading font-bold text-forge-base transition-colors hover:bg-forge-orange-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              Submit to the Mirror
              {/* Hover glow */}
              <span
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ boxShadow: "inset 0 0 30px rgba(255,107,43,0.3)" }}
              />
            </button>
          </div>
        )}

        {/* AI Response area */}
        {showResponse && (
          <div ref={responseRef} className="mt-10">
            <div
              className="border-l-[3px] border-forge-orange p-5"
              style={{ background: "rgba(255,107,43,0.04)" }}
            >
              {/* Waiting for first token */}
              {waitingForFirst && !streamedText && (
                <div className="flex items-center gap-3 text-sm text-text-muted">
                  <span>Forge Coach is thinking</span>
                  <PulsingDots />
                </div>
              )}

              {/* Streamed response */}
              {streamedText && (
                <div
                  className="whitespace-pre-wrap text-base text-text-primary"
                  style={{ lineHeight: "1.75" }}
                >
                  {streamedText}
                  {isStreaming && (
                    <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-forge-orange align-middle" />
                  )}
                </div>
              )}

              {/* Error state */}
              {error && !isStreaming && (
                <div className="text-sm">
                  {error === "GEMINI_API_KEY_MISSING" ? (
                    <div className="space-y-1">
                      <p className="font-semibold text-forge-orange">
                        Gemini API key not configured
                      </p>
                      <p className="text-text-muted">
                        Add your <code className="rounded bg-white/10 px-1 py-0.5 font-mono">GEMINI_API_KEY</code> in the{" "}
                        <strong className="text-text-secondary">Secrets</strong> tab (🔒 in the sidebar), then refresh the page.
                      </p>
                      <p className="text-text-disabled">
                        Get your key at{" "}
                        <a
                          href="https://aistudio.google.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-forge-orange"
                        >
                          aistudio.google.com
                        </a>
                      </p>
                    </div>
                  ) : (
                    <p className="text-red-400">
                      Coach unavailable — please try refreshing.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Continue button */}
            {isComplete && !error && (
              <button
                onClick={handleContinue}
                disabled={updateProfile.isPending}
                className="mt-8 w-full bg-forge-orange py-4 font-heading font-bold text-forge-base transition-colors hover:bg-forge-orange-hover disabled:opacity-50"
              >
                {updateProfile.isPending ? "Saving…" : "I'm Ready — Continue"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
