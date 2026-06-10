"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/trpc/client";
import { useStreamingResponse } from "@/hooks/useStreamingResponse";
import { RuleForty } from "@/components/forge/RuleForty";

type Phase = "idle" | "submitting" | "streaming" | "classifying" | "complete";

const MOOD_LABELS: Record<string, { label: string; color: string }> = {
  excusing:   { label: "Excusing",   color: "text-red-400 border-red-800 bg-red-950/30" },
  deflecting: { label: "Deflecting", color: "text-orange-400 border-orange-800 bg-orange-950/30" },
  owning:     { label: "Owning",     color: "text-blue-400 border-blue-800 bg-blue-950/30" },
  crushing:   { label: "Crushing",   color: "text-green-400 border-green-800 bg-green-950/30" },
};

function todayLabel(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function getLocalDate(): string {
  return new Date().toLocaleDateString("en-CA");
}

function yesterdayDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export default function CheckinPage() {
  const localDate = getLocalDate();
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [checkinId, setCheckinId] = useState<string | null>(null);
  const [submittedText, setSubmittedText] = useState("");
  const [honestyScore, setHonestyScore] = useState<number | null>(null);
  const [moodSignal, setMoodSignal] = useState<string | null>(null);
  const [showRuleForty, setShowRuleForty] = useState(false);
  const [isFree, setIsFree] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debriefEndRef = useRef<HTMLDivElement>(null);

  const { streamedText, isStreaming, isComplete, startStream, reset } =
    useStreamingResponse();

  // tRPC
  const { data: profile } = api.user.getProfile.useQuery(undefined, { retry: false });
  const { data: todayCheckin, isLoading: checkinLoading } =
    api.checkins.getToday.useQuery({ localDate }, { retry: false });
  const { data: history } = api.checkins.getHistory.useQuery(
    { limit: 2 },
    { retry: false }
  );
  const submitMutation = api.checkins.submit.useMutation();
  const updateMetadata = api.checkins.updateMetadata.useMutation();

  // Detect free tier
  useEffect(() => {
    if (profile) setIsFree(profile.tier === "free");
  }, [profile]);

  // If check-in already done today, enter complete phase
  useEffect(() => {
    if (todayCheckin && !checkinLoading) {
      setCheckinId(todayCheckin.id);
      setSubmittedText(todayCheckin.rawReflection ?? "");
      setHonestyScore(todayCheckin.honestyScore ?? null);
      setMoodSignal(todayCheckin.moodSignal ?? null);
      setPhase("complete");
    }
  }, [todayCheckin, checkinLoading]);

  // Scroll debrief to bottom as it streams
  useEffect(() => {
    debriefEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [streamedText]);

  // After stream completes → classify
  useEffect(() => {
    if (isComplete && phase === "streaming" && streamedText && checkinId) {
      handleClassify(streamedText, checkinId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete, phase]);

  // Auto-expand textarea
  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  }

  const handleSubmit = useCallback(async () => {
    if (text.trim().length < 50 || phase !== "idle") return;
    setPhase("submitting");

    try {
      const result = await submitMutation.mutateAsync({
        text: text.trim(),
        localDate,
        onboardingMirror: false,
      });

      const id = result.id as string;
      setCheckinId(id);
      setSubmittedText(text.trim());

      if (isFree) {
        setPhase("complete");
        return;
      }

      // Pro: start streaming debrief
      setPhase("streaming");
      reset();
      await startStream("/api/coach/stream", {
        session_type: "daily_checkin",
        messages: [{ role: "user", parts: [{ text: text.trim() }] }],
        context: {
          why_statement: profile?.whyStatement ?? "",
          identity_declaration: profile?.identityDeclaration ?? "",
          forge_score: profile?.forgeScore ?? 0,
        },
      });
    } catch {
      setPhase("idle");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, phase, localDate, isFree, profile]);

  const handleClassify = useCallback(
    async (debriefText: string, id: string) => {
      setPhase("classifying");
      try {
        const res = await fetch("/api/coach/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checkin_id: id, text: submittedText }),
        });

        if (res.ok) {
          const { honesty_score, mood_signal } = await res.json();
          setHonestyScore(honesty_score);
          setMoodSignal(mood_signal);

          await updateMetadata.mutateAsync({
            checkinId: id,
            honestyScore: honesty_score,
            moodSignal: mood_signal,
            aiResponse: debriefText,
          });

          // Trigger 40% Rule overlay on excusing/deflecting
          if (mood_signal === "excusing" || mood_signal === "deflecting") {
            setShowRuleForty(true);
          }

          // Background: memory extraction via API route
          void fetch("/api/memory/extract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: id, text: submittedText }),
          }).catch(() => {});
        }
      } catch {
        // Classification failure is non-fatal
      } finally {
        setPhase("complete");
      }
    },
    [submittedText, updateMetadata]
  );

  // Yesterday's check-in reference
  const yDate = yesterdayDate();
  const yesterdayCheckin = history?.find(
    (h: { localDate: string }) => h.localDate === yDate
  );

  // -------------------------------------------------------------------
  // Loading skeleton while checking today's status
  // -------------------------------------------------------------------
  if (checkinLoading) {
    return (
      <div className="mx-auto max-w-[720px] px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-8 space-y-2 animate-pulse">
          <div className="h-8 w-72 rounded bg-forge-border" />
        </div>
        <div className="h-48 animate-pulse rounded bg-forge-elevated" />
      </div>
    );
  }

  const moodMeta = moodSignal ? MOOD_LABELS[moodSignal] : null;

  return (
    <>
      <div className="mx-auto max-w-[720px] px-4 sm:px-6 py-8 sm:py-12">
        {/* Page heading */}
        <h1 className="mb-8 font-heading text-2xl sm:text-3xl font-bold text-text-primary">
          The Mirror —{" "}
          <span className="text-text-secondary">{todayLabel()}</span>
        </h1>

        {/* ================================================================
            STATE A — No check-in yet
           ================================================================ */}
        {phase === "idle" && (
          <div className="space-y-4">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              placeholder="What actually happened? Be honest."
              className="w-full resize-none border border-forge-border bg-forge-input px-5 py-4 text-sm leading-relaxed text-text-primary placeholder-text-disabled outline-none focus:border-forge-orange focus:ring-1 focus:ring-forge-orange"
              style={{ minHeight: "260px" }}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">
                {text.length < 50 && (
                  <>{50 - text.length} more characters to unlock submit</>
                )}
              </span>
              <span className="text-xs tabular-nums text-text-muted">
                {text.length}
              </span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={text.trim().length < 50}
              className="w-full bg-forge-orange py-3.5 min-h-[52px] text-sm font-bold text-forge-base hover:bg-forge-orange-hover disabled:opacity-40"
            >
              Submit to the Mirror
            </button>
          </div>
        )}

        {/* ================================================================
            STATE A (submitting) — brief loading
           ================================================================ */}
        {phase === "submitting" && (
          <div className="flex items-center gap-3 py-8">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="inline-block h-2 w-2 rounded-full bg-forge-orange"
                style={{
                  animation: `bounce-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
            <span className="text-sm text-text-muted">Submitting…</span>
          </div>
        )}

        {/* ================================================================
            STATE B — Streaming debrief (or free-tier gate)
           ================================================================ */}
        {(phase === "streaming" || phase === "classifying") && (
          <div className="space-y-6">
            {/* Submitted text in muted card */}
            <div className="bg-[#1A1918] px-5 py-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
                {submittedText}
              </p>
            </div>

            {/* Streaming debrief */}
            <div>
              {!streamedText && isStreaming && (
                <div className="mb-3 flex items-center gap-2">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="inline-block h-1.5 w-1.5 rounded-full bg-forge-orange"
                      style={{
                        animation: `bounce-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                  <span className="text-xs text-text-muted">
                    Forge Coach is analyzing…
                  </span>
                </div>
              )}

              {streamedText && (
                <div
                  className="px-5 py-4 text-sm leading-relaxed text-text-secondary"
                  style={{ borderLeft: "3px solid #FF6B2B" }}
                >
                  <span className="whitespace-pre-wrap">{streamedText}</span>
                  {isStreaming && (
                    <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-forge-orange align-middle" />
                  )}
                  <div ref={debriefEndRef} />
                </div>
              )}

              {phase === "classifying" && (
                <p className="mt-3 text-xs text-text-muted">Scoring honesty…</p>
              )}
            </div>
          </div>
        )}

        {/* Free-tier upgrade prompt — shown after submit when free */}
        {phase === "complete" && isFree && !todayCheckin?.aiResponse && (
          <div className="mt-6 border border-forge-orange/40 bg-[#1A0A04] px-6 py-5">
            <p className="text-sm font-medium text-text-primary">
              Upgrade to Pro to unlock your AI debrief.
            </p>
            <p className="mt-1 text-sm text-text-muted">
              Get a personalized coaching response after every check-in — identifying your excuses, naming your patterns, and giving you a daily challenge.
            </p>
            <button className="mt-4 border border-forge-orange px-5 py-2 text-sm font-bold text-forge-orange hover:bg-forge-orange hover:text-forge-base transition-colors">
              Upgrade to Pro →
            </button>
          </div>
        )}

        {/* ================================================================
            STATE C — Complete
           ================================================================ */}
        {phase === "complete" && (
          <div className="space-y-6">
            {/* Status badge */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="border border-green-800/50 bg-green-950/30 px-3 py-1 text-xs font-medium text-green-400">
                ✓ Check-in complete for today
              </span>
              {moodMeta && (
                <span
                  className={`border px-3 py-1 text-xs font-medium ${moodMeta.color}`}
                >
                  {moodMeta.label}
                </span>
              )}
              {honestyScore !== null && (
                <span className="border border-forge-border px-3 py-1 text-xs font-medium text-text-muted">
                  Honesty: {honestyScore}/10
                </span>
              )}
            </div>

            {/* Submitted text */}
            <div className="bg-[#1A1918] px-5 py-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
                {submittedText || todayCheckin?.rawReflection}
              </p>
            </div>

            {/* AI debrief — pro, complete */}
            {(streamedText || todayCheckin?.aiResponse) && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-5 py-4 text-sm leading-relaxed text-text-secondary"
                  style={{ borderLeft: "3px solid #FF6B2B" }}
                >
                  <p className="whitespace-pre-wrap">
                    {streamedText || todayCheckin?.aiResponse}
                  </p>
                </motion.div>
              </AnimatePresence>
            )}

            {/* Link to yesterday */}
            {yesterdayCheckin && (
              <p className="text-sm text-text-muted">
                Yesterday:{" "}
                <Link
                  href={`/checkin/history/${yesterdayCheckin.id}`}
                  className="text-forge-orange hover:underline"
                >
                  View yesterday's mirror →
                </Link>
              </p>
            )}
          </div>
        )}
      </div>

      {/* 40% Rule Overlay */}
      <RuleForty
        open={showRuleForty}
        onClose={() => setShowRuleForty(false)}
        triggerContext={`Daily check-in mood: ${moodSignal}. Entry: "${submittedText.slice(0, 200)}"`}
      />

      <style>{`
        @keyframes bounce-dot {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.3; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </>
  );
}
