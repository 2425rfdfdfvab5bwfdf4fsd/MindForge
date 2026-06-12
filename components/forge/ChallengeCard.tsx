"use client";

import { useState, useEffect } from "react";
import { Lock, Clock, Zap, CheckCircle2, XCircle, Loader2, Trophy, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface ChallengeData {
  id: string;
  title: string;
  description: string;
  difficulty: number;
  category: string;
  durationMinutes: number;
  xpReward: number;
  isActive: boolean;
  userChallenge?: {
    id: string;
    status: string;
    startedAt?: string | Date | null;
    completedAt?: string | Date | null;
    reflection?: string | null;
  } | null;
  expiresAt?: string | null;
}

interface ChallengeCardProps {
  challenge: ChallengeData;
  isFree: boolean;
  hasActiveChallenge: boolean;
  onActivate: (challengeId: string) => void;
  onComplete: (userChallengeId: string, reflection: string) => void;
  isActivating?: boolean;
  isCompleting?: boolean;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
  const days = Math.round(minutes / 1440);
  return `${days}d`;
}

function useCountdown(expiresAt: string | null | undefined): string | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!expiresAt) return;
    const id = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - now;
  if (ms <= 0) return "Expired";
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
}

function DifficultyBars({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-0.5" title={`Difficulty ${level}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="h-2 w-1.5 transition-colors"
          style={{ background: i <= level ? "#FF6B2B" : "#2A2927" }}
        />
      ))}
    </div>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  cold:     "text-blue-400 border-blue-800/50 bg-blue-950/30",
  screen:   "text-purple-400 border-purple-800/50 bg-purple-950/30",
  physical: "text-orange-400 border-orange-800/50 bg-orange-950/30",
  fast:     "text-yellow-400 border-yellow-800/50 bg-yellow-950/30",
  social:   "text-green-400 border-green-800/50 bg-green-950/30",
};

const CATEGORY_LABELS: Record<string, string> = {
  cold: "Cold", screen: "Screen", physical: "Physical", fast: "Fast", social: "Social",
};

export function ChallengeCard({ challenge, isFree, hasActiveChallenge, onActivate, onComplete, isActivating, isCompleting }: ChallengeCardProps) {
  const [showComplete, setShowComplete] = useState(false);
  const [reflection, setReflection] = useState("");
  const [reflectionError, setReflectionError] = useState("");
  const [expanded, setExpanded] = useState(false);

  const status = challenge.userChallenge?.status ?? "none";
  const isLocked = isFree && challenge.difficulty > 1;
  const countdown = useCountdown(challenge.expiresAt);
  const isLong = challenge.description.length > 140;

  const accentColor =
    status === "active"    ? "#FF6B2B" :
    status === "completed" ? "#22C55E" :
    status === "failed"    ? "#EF4444" :
    "#2A2927";

  const catColor = CATEGORY_COLORS[challenge.category] ?? "text-text-muted border-forge-border bg-forge-border/20";

  function handleComplete() {
    if (reflection.trim().length < 50) {
      setReflectionError("Write at least 50 characters about what this experience cost you.");
      return;
    }
    setReflectionError("");
    onComplete(challenge.userChallenge!.id, reflection.trim());
  }

  return (
    <div
      className="relative bg-forge-elevated transition-all duration-200 group overflow-hidden flex flex-col"
      style={{ border: `1px solid ${accentColor}` }}
    >
      {/* Left status bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ background: accentColor, opacity: status === "none" ? 0.25 : 1 }}
      />

      {/* Lock overlay */}
      {isLocked && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-forge-base/70 backdrop-blur-[1.5px]">
          <div className="flex flex-col items-center gap-2 text-center px-6">
            <div className="flex h-10 w-10 items-center justify-center border border-forge-orange/20 bg-forge-orange/10">
              <Lock className="h-4 w-4 text-forge-orange" />
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 border"
              style={{ background: "rgba(255,107,43,0.12)", color: "#FF6B2B", borderColor: "rgba(255,107,43,0.25)" }}>
              PRO ONLY
            </span>
          </div>
        </div>
      )}

      <div className="pl-6 pr-5 pt-5 pb-4 flex flex-col flex-1">

        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-heading text-base font-bold text-text-primary leading-snug flex-1">
            {challenge.title}
          </h3>
          <div className="shrink-0 flex items-center gap-2 mt-0.5">
            {status === "active" && (
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-forge-orange animate-pulse" />
                <span className="text-xs font-bold text-forge-orange">Active</span>
              </span>
            )}
            {status === "completed" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            {status === "failed"    && <XCircle className="h-4 w-4 text-red-400" />}
          </div>
        </div>

        {/* Meta pills row */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <DifficultyBars level={challenge.difficulty} />
          <span className={`text-xs px-2 py-0.5 border font-medium ${catColor}`}>
            {CATEGORY_LABELS[challenge.category] ?? challenge.category}
          </span>
          <span className="flex items-center gap-1 text-xs text-text-disabled">
            <Clock className="h-3 w-3" />
            {formatDuration(challenge.durationMinutes)}
          </span>
          <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 border"
            style={{ background: "rgba(255,107,43,0.10)", color: "#FFBDA3", borderColor: "rgba(255,107,43,0.20)" }}>
            <Zap className="h-2.5 w-2.5" />
            {challenge.xpReward} XP
          </span>
        </div>

        {/* Description */}
        <div className="mb-4 flex-1">
          <p className={`text-sm leading-relaxed text-text-secondary ${expanded || !isLong ? "" : "line-clamp-2"}`}>
            {challenge.description}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="mt-1 flex items-center gap-1 text-xs text-forge-orange hover:text-forge-orange-hover transition-colors"
            >
              {expanded ? <><ChevronUp className="h-3 w-3" />Less</> : <><ChevronDown className="h-3 w-3" />More</>}
            </button>
          )}
        </div>

        {/* Countdown */}
        {status === "active" && countdown && (
          <div className="mb-3 flex items-center gap-1.5">
            <Clock className="h-3 w-3" style={{ color: countdown === "Expired" ? "#EF4444" : "#FF6B2B" }} />
            <span className="text-xs font-mono font-bold"
              style={{ color: countdown === "Expired" ? "#EF4444" : "#FF6B2B" }}>
              {countdown}
            </span>
          </div>
        )}

        {/* Completion form */}
        <AnimatePresence>
          {showComplete && status === "active" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-4 overflow-hidden"
            >
              <div className="border border-forge-border bg-forge-overlay p-4 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
                      Your Reflection <span className="text-forge-orange">*</span>
                    </label>
                    <span className={`text-xs font-mono ${reflection.length >= 50 ? "text-green-500" : "text-text-disabled"}`}>
                      {reflection.length}/50 min
                    </span>
                  </div>
                  <textarea
                    value={reflection}
                    onChange={(e) => { setReflection(e.target.value); if (reflectionError) setReflectionError(""); }}
                    placeholder="What did you learn? What did it cost you? What changed?"
                    rows={3}
                    className="w-full bg-forge-input border border-forge-border px-3 py-2.5 text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-forge-orange focus:ring-1 focus:ring-forge-orange/20 transition-colors resize-none"
                    autoFocus
                  />
                  {reflectionError && (
                    <p className="mt-1 text-xs text-red-400">{reflectionError}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleComplete}
                    disabled={isCompleting}
                    className="flex-1 py-2.5 text-sm font-bold text-white bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {isCompleting
                      ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving…</>
                      : "Mark Complete →"
                    }
                  </button>
                  <button
                    onClick={() => { setShowComplete(false); setReflection(""); setReflectionError(""); }}
                    disabled={isCompleting}
                    className="px-4 py-2.5 text-sm text-text-muted border border-forge-border hover:border-forge-border-strong hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action area */}
        {!isLocked && (
          <div className="mt-auto">
            {status === "none" && (
              <button
                onClick={() => onActivate(challenge.id)}
                disabled={isActivating || hasActiveChallenge}
                title={hasActiveChallenge ? "Finish your current challenge first" : undefined}
                className="w-full py-2.5 text-sm font-bold text-forge-base bg-forge-orange hover:bg-forge-orange-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isActivating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                {isActivating ? "Starting…" : "Start Challenge"}
              </button>
            )}
            {status === "active" && !showComplete && (
              <button
                onClick={() => setShowComplete(true)}
                disabled={isCompleting}
                className="w-full py-2.5 text-sm font-bold border border-green-700 text-green-400 hover:bg-green-950/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <Trophy className="h-3.5 w-3.5" />
                Complete Challenge
              </button>
            )}
            {status === "completed" && (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 py-1 text-sm font-bold text-green-500">
                  <CheckCircle2 className="h-4 w-4" />
                  Completed
                </div>
                <button
                  onClick={() => onActivate(challenge.id)}
                  disabled={isActivating || hasActiveChallenge}
                  title={hasActiveChallenge ? "Finish your current challenge first" : undefined}
                  className="w-full py-2 text-xs font-bold border border-forge-border text-text-muted hover:border-forge-border-strong hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
                >
                  {isActivating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                  {isActivating ? "Starting…" : "Try Again"}
                </button>
              </div>
            )}
            {status === "failed" && (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 py-1 text-xs text-red-400">
                  <XCircle className="h-3.5 w-3.5" />
                  Failed — you can try again
                </div>
                <button
                  onClick={() => onActivate(challenge.id)}
                  disabled={isActivating || hasActiveChallenge}
                  title={hasActiveChallenge ? "Finish your current challenge first" : undefined}
                  className="w-full py-2.5 text-sm font-bold text-forge-base bg-forge-orange hover:bg-forge-orange-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isActivating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
