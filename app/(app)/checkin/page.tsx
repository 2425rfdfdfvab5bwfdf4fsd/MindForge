"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, CheckCircle2, Flame, TrendingUp, Clock, ChevronRight, Zap } from "lucide-react";
import { api } from "@/lib/trpc/client";
import { useStreamingResponse } from "@/hooks/useStreamingResponse";
import { RuleForty } from "@/components/forge/RuleForty";

type Phase = "idle" | "submitting" | "streaming" | "classifying" | "complete";

const MOOD_META: Record<string, { label: string; pill: string; bar: string; description: string }> = {
  excusing:   {
    label: "Excusing",
    pill: "text-red-400 border-red-800/60 bg-red-950/40",
    bar: "bg-red-500",
    description: "You're making excuses. Own it.",
  },
  deflecting: {
    label: "Deflecting",
    pill: "text-orange-400 border-orange-800/60 bg-orange-950/40",
    bar: "bg-orange-500",
    description: "You're pointing outward. Look inward.",
  },
  owning:     {
    label: "Owning It",
    pill: "text-blue-400 border-blue-800/60 bg-blue-950/40",
    bar: "bg-blue-500",
    description: "Solid self-awareness. Keep pushing.",
  },
  crushing:   {
    label: "Crushing",
    pill: "text-green-400 border-green-800/60 bg-green-950/40",
    bar: "bg-green-500",
    description: "Elite mindset. This is who you are.",
  },
};

const MIRROR_PROMPTS = [
  "Did you do what you said you would? Be specific.",
  "Where did you settle for less than your standard?",
  "What excuse did you use today that you'd hate to hear from someone else?",
  "What would the best version of you think of today?",
];

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

function BounceDots({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block h-1.5 w-1.5 rounded-full bg-forge-orange"
          style={{ animation: `bounce-dot 1.2s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
      <span className="text-xs text-text-muted">{label}</span>
    </div>
  );
}

function HonestyGauge({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  const color =
    score >= 8 ? "bg-green-500" :
    score >= 5 ? "bg-blue-500" :
    score >= 3 ? "bg-orange-500" :
    "bg-red-500";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-text-muted">Honesty Score</span>
        <span className="font-heading text-sm font-bold text-text-primary">{score}<span className="text-text-muted font-normal">/10</span></span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-forge-border">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full ${color}`}
        />
      </div>
    </div>
  );
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
  const [promptIdx] = useState(() => Math.floor(Math.random() * MIRROR_PROMPTS.length));
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debriefEndRef = useRef<HTMLDivElement>(null);

  const { streamedText, isStreaming, isComplete, startStream, reset } = useStreamingResponse();

  const { data: profile } = api.user.getProfile.useQuery(undefined, { retry: false });
  const { data: todayCheckin, isLoading: checkinLoading } =
    api.checkins.getToday.useQuery({ localDate }, { retry: false });
  const { data: history } = api.checkins.getHistory.useQuery({ limit: 2 }, { retry: false });
  const submitMutation = api.checkins.submit.useMutation();
  const updateMetadata = api.checkins.updateMetadata.useMutation();

  useEffect(() => {
    if (profile) setIsFree(profile.tier === "free");
  }, [profile]);

  useEffect(() => {
    if (todayCheckin && !checkinLoading) {
      setCheckinId(todayCheckin.id);
      setSubmittedText(todayCheckin.rawReflection ?? "");
      setHonestyScore(todayCheckin.honestyScore ?? null);
      setMoodSignal(todayCheckin.moodSignal ?? null);
      setPhase("complete");
    }
  }, [todayCheckin, checkinLoading]);

  useEffect(() => {
    debriefEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [streamedText]);

  useEffect(() => {
    if (isComplete && phase === "streaming" && streamedText && checkinId) {
      handleClassify(streamedText, checkinId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete, phase]);

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
      if (isFree) { setPhase("complete"); return; }
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
          if (mood_signal === "excusing" || mood_signal === "deflecting") {
            setShowRuleForty(true);
          }
          void fetch("/api/memory/extract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: id, text: submittedText }),
          }).catch(() => {});
        }
      } catch {
        // non-fatal
      } finally {
        setPhase("complete");
      }
    },
    [submittedText, updateMetadata]
  );

  const yDate = yesterdayDate();
  const yesterdayCheckin = history?.find(
    (h: { localDate: string }) => h.localDate === yDate
  );
  const charCount = text.length;
  const minChars = 50;
  const ready = charCount >= minChars;
  const moodMeta = moodSignal ? MOOD_META[moodSignal] : null;

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (checkinLoading) {
    return (
      <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 space-y-3 animate-pulse">
            <div className="h-4 w-32 bg-forge-elevated rounded" />
            <div className="h-8 w-80 bg-forge-elevated rounded" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            <div className="h-72 animate-pulse bg-forge-elevated" />
            <div className="space-y-4">
              <div className="h-32 animate-pulse bg-forge-elevated" />
              <div className="h-24 animate-pulse bg-forge-elevated" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <>
      <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
        <div className="mx-auto max-w-6xl">

          {/* ── Page header ─────────────────────────────────────────────── */}
          <div className="mb-8 lg:mb-10">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-forge-orange" />
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-forge-orange">
                Daily Mirror
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-text-primary leading-tight">
                {phase === "complete" ? "Mirror Complete" : "Face the Mirror"}
                <span className="block text-base sm:text-lg font-normal text-text-muted mt-1">
                  {todayLabel()}
                </span>
              </h1>
              {phase === "complete" && (
                <div className="flex items-center gap-2 shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-medium text-green-400">Checked in today</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Two-column grid ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_340px] gap-6 lg:gap-8 items-start">

            {/* ── LEFT: Main content ────────────────────────────────────── */}
            <div className="min-w-0 space-y-5">

              {/* STATE: idle — write reflection */}
              {phase === "idle" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Prompt card */}
                  <div className="border border-forge-border bg-forge-elevated px-5 py-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-forge-orange mb-1">Today&apos;s Prompt</p>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {MIRROR_PROMPTS[promptIdx]}
                    </p>
                  </div>

                  {/* Textarea */}
                  <div className="relative">
                    <textarea
                      ref={textareaRef}
                      value={text}
                      onChange={handleTextChange}
                      placeholder="What actually happened today? Be specific and honest. No excuses."
                      className="w-full resize-none border border-forge-border bg-forge-input px-5 py-4 text-sm leading-relaxed text-text-primary placeholder-text-disabled outline-none focus:border-forge-orange focus:ring-1 focus:ring-forge-orange/30 transition-colors"
                      style={{ minHeight: "280px" }}
                    />
                    {/* Character progress bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-forge-border overflow-hidden">
                      <motion.div
                        className={`h-full transition-colors ${ready ? "bg-forge-orange" : "bg-forge-border-strong"}`}
                        animate={{ width: `${Math.min((charCount / minChars) * 100, 100)}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                  </div>

                  {/* Footer row */}
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-text-muted">
                      {!ready
                        ? <span className="text-text-disabled">{minChars - charCount} more characters required</span>
                        : <span className="text-forge-orange">Ready to submit</span>
                      }
                    </span>
                    <span className="text-xs tabular-nums text-text-disabled">{charCount}</span>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={!ready}
                    className="w-full bg-forge-orange py-4 text-sm font-bold tracking-wide text-forge-base hover:bg-forge-orange-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Submit to the Mirror →
                  </button>
                </motion.div>
              )}

              {/* STATE: submitting */}
              {phase === "submitting" && (
                <div className="border border-forge-border bg-forge-elevated px-6 py-10 flex items-center gap-4">
                  <BounceDots label="Submitting your reflection…" />
                </div>
              )}

              {/* STATE: streaming / classifying */}
              {(phase === "streaming" || phase === "classifying") && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-5"
                >
                  {/* Submitted text */}
                  <div className="border border-forge-border bg-forge-elevated px-5 py-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-text-disabled mb-3">Your Reflection</p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
                      {submittedText}
                    </p>
                  </div>

                  {/* AI Debrief streaming */}
                  <div className="border border-forge-orange/30 bg-[#1C0E06]">
                    <div className="flex items-center gap-2 border-b border-forge-orange/20 px-5 py-3">
                      <Flame className="h-3.5 w-3.5 text-forge-orange" />
                      <span className="text-xs font-bold uppercase tracking-wider text-forge-orange">Forge Coach</span>
                      {isStreaming && (
                        <span className="ml-auto">
                          <BounceDots label="Analyzing…" />
                        </span>
                      )}
                    </div>
                    <div className="px-5 py-4 text-sm leading-relaxed text-text-secondary min-h-[80px]">
                      {!streamedText && isStreaming && (
                        <span className="text-text-disabled text-xs">Generating your debrief…</span>
                      )}
                      <span className="whitespace-pre-wrap">{streamedText}</span>
                      {isStreaming && streamedText && (
                        <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-forge-orange align-middle" />
                      )}
                      <div ref={debriefEndRef} />
                    </div>
                    {phase === "classifying" && (
                      <div className="border-t border-forge-border/50 px-5 py-3">
                        <BounceDots label="Scoring your honesty…" />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* STATE: complete */}
              {phase === "complete" && (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-5"
                  >
                    {/* Score bar row */}
                    {(honestyScore !== null || moodMeta) && (
                      <div className="border border-forge-border bg-forge-elevated px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {honestyScore !== null && (
                          <HonestyGauge score={honestyScore} />
                        )}
                        {moodMeta && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium uppercase tracking-wider text-text-muted">Mindset Signal</span>
                              <span className={`text-xs font-bold px-2.5 py-0.5 border ${moodMeta.pill}`}>
                                {moodMeta.label}
                              </span>
                            </div>
                            <p className="text-xs text-text-muted leading-relaxed">{moodMeta.description}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Submitted reflection */}
                    <div className="border border-forge-border bg-forge-elevated">
                      <div className="flex items-center gap-2 border-b border-forge-border px-5 py-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-text-disabled">Your Reflection</span>
                      </div>
                      <div className="px-5 py-4">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
                          {submittedText || todayCheckin?.rawReflection}
                        </p>
                      </div>
                    </div>

                    {/* Free-tier upgrade prompt */}
                    {isFree && !todayCheckin?.aiResponse && (
                      <div className="border border-forge-orange/30 bg-[#1C0E06] overflow-hidden">
                        <div className="flex items-center gap-2 border-b border-forge-orange/20 px-5 py-3">
                          <Zap className="h-3.5 w-3.5 text-forge-orange" />
                          <span className="text-xs font-bold uppercase tracking-wider text-forge-orange">Pro Feature</span>
                        </div>
                        <div className="px-5 py-5">
                          <p className="text-sm font-semibold text-text-primary mb-1">
                            Unlock your AI debrief
                          </p>
                          <p className="text-sm text-text-muted leading-relaxed mb-4">
                            Pro members get a personalized Forge Coach response after every check-in — pinpointing excuses, naming patterns, and issuing a daily challenge.
                          </p>
                          <Link
                            href="/upgrade"
                            className="inline-flex items-center gap-2 border border-forge-orange px-5 py-2.5 text-sm font-bold text-forge-orange hover:bg-forge-orange hover:text-forge-base transition-all duration-200"
                          >
                            Upgrade to Pro <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* AI debrief — pro complete */}
                    {(streamedText || todayCheckin?.aiResponse) && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border border-forge-orange/30 bg-[#1C0E06]"
                      >
                        <div className="flex items-center gap-2 border-b border-forge-orange/20 px-5 py-3">
                          <Flame className="h-3.5 w-3.5 text-forge-orange" />
                          <span className="text-xs font-bold uppercase tracking-wider text-forge-orange">Forge Coach Debrief</span>
                        </div>
                        <div className="px-5 py-4">
                          <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
                            {streamedText || todayCheckin?.aiResponse}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>

            {/* ── RIGHT: Context sidebar ────────────────────────────────── */}
            <div className="space-y-4 lg:sticky lg:top-6">

              {/* Stats snapshot */}
              {profile && (
                <div className="border border-forge-border bg-forge-elevated">
                  <div className="border-b border-forge-border px-4 py-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Your Stats</span>
                  </div>
                  <div className="divide-y divide-forge-border">
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-2.5 text-text-muted">
                        <TrendingUp className="h-3.5 w-3.5 text-forge-orange" />
                        <span className="text-xs">Forge Score</span>
                      </div>
                      <span className="font-heading text-sm font-bold text-text-primary">
                        {profile.forgeScore ?? 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-2.5 text-text-muted">
                        <Flame className="h-3.5 w-3.5 text-forge-orange" />
                        <span className="text-xs">Level</span>
                      </div>
                      <span className="font-heading text-sm font-bold text-text-primary">
                        {profile.level ?? 1}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-2.5 text-text-muted">
                        <Zap className="h-3.5 w-3.5 text-forge-orange" />
                        <span className="text-xs">Total XP</span>
                      </div>
                      <span className="font-heading text-sm font-bold text-text-primary">
                        {profile.xp ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Yesterday's check-in */}
              {yesterdayCheckin ? (
                <div className="border border-forge-border bg-forge-elevated">
                  <div className="border-b border-forge-border px-4 py-3 flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-text-disabled" />
                    <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Yesterday</span>
                  </div>
                  <div className="px-4 py-3 space-y-3">
                    <p className="text-xs leading-relaxed text-text-muted line-clamp-4">
                      {yesterdayCheckin.rawReflection}
                    </p>
                    {yesterdayCheckin.honestyScore != null && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-disabled">Honesty:</span>
                        <span className="text-xs font-bold text-text-secondary">
                          {yesterdayCheckin.honestyScore}/10
                        </span>
                      </div>
                    )}
                    <Link
                      href={`/checkin/history/${yesterdayCheckin.id}`}
                      className="inline-flex items-center gap-1 text-xs text-forge-orange hover:text-forge-orange-text transition-colors"
                    >
                      Full entry <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="border border-forge-border bg-forge-elevated px-4 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-3.5 w-3.5 text-text-disabled" />
                    <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Yesterday</span>
                  </div>
                  <p className="text-xs text-text-disabled leading-relaxed">
                    No check-in recorded yesterday.
                  </p>
                </div>
              )}

              {/* Mindset tip */}
              {phase === "idle" && (
                <div className="border border-forge-border/50 bg-forge-subtle px-4 py-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-text-disabled mb-2">The 40% Rule</p>
                  <p className="text-xs leading-relaxed text-text-disabled">
                    When your mind says you&apos;re done, you&apos;re only at 40% of your capacity. The mirror is where you find the other 60%.
                  </p>
                </div>
              )}

              {/* Navigation links */}
              <div className="border border-forge-border bg-forge-elevated divide-y divide-forge-border">
                <Link href="/dashboard" className="flex items-center justify-between px-4 py-3 text-xs text-text-muted hover:text-text-primary hover:bg-forge-overlay transition-colors group">
                  <span>Dashboard</span>
                  <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
                <Link href="/habits" className="flex items-center justify-between px-4 py-3 text-xs text-text-muted hover:text-text-primary hover:bg-forge-overlay transition-colors group">
                  <span>Habits</span>
                  <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
                <Link href="/coach" className="flex items-center justify-between px-4 py-3 text-xs text-text-muted hover:text-text-primary hover:bg-forge-overlay transition-colors group">
                  <span>AI Coach</span>
                  <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

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
