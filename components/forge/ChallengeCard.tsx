"use client";

import { useState } from "react";
import { Lock, Clock, Zap, CheckCircle, XCircle, Loader2 } from "lucide-react";

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
  onActivate: (challengeId: string) => void;
  onComplete: (userChallengeId: string, reflection: string) => void;
  isActivating?: boolean;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
  const days = Math.round(minutes / 1440);
  return `${days} day${days !== 1 ? "s" : ""}`;
}

function useCountdown(expiresAt: string | null | undefined) {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${mins}m remaining`;
  return `${mins}m remaining`;
}

function DifficultyBars({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="h-2.5 w-1.5"
          style={{
            background: i <= level ? "#FF6B2B" : "#2A2927",
          }}
        />
      ))}
    </div>
  );
}

const CATEGORY_LABELS: Record<string, string> = {
  cold: "Cold",
  screen: "Screen",
  physical: "Physical",
  fast: "Fast",
  social: "Social",
};

export function ChallengeCard({
  challenge,
  isFree,
  onActivate,
  onComplete,
  isActivating,
}: ChallengeCardProps) {
  const [showComplete, setShowComplete] = useState(false);
  const [reflection, setReflection] = useState("");
  const [reflectionError, setReflectionError] = useState("");

  const status = challenge.userChallenge?.status ?? "none";
  const isLocked = isFree && challenge.difficulty > 1;
  const countdown = useCountdown(challenge.expiresAt);

  const borderColor =
    status === "active"
      ? "#FF6B2B"
      : status === "completed"
      ? "#22C55E"
      : "#2A2927";

  function handleComplete() {
    if (reflection.trim().length < 50) {
      setReflectionError("Write at least 50 characters about this experience.");
      return;
    }
    setReflectionError("");
    onComplete(challenge.userChallenge!.id, reflection.trim());
    setShowComplete(false);
  }

  return (
    <div
      className="relative bg-[#111110] transition-colors group"
      style={{ border: `1px solid ${borderColor}` }}
    >
      {/* Active pulsing indicator */}
      {status === "active" && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5">
          <div
            className="h-2 w-2 rounded-full bg-forge-orange animate-pulse"
          />
        </div>
      )}

      {/* Lock overlay for free tier */}
      {isLocked && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-forge-base/60 backdrop-blur-[1px]">
          <div className="flex flex-col items-center gap-2 text-center px-6">
            <Lock size={20} className="text-text-muted" />
            <span
              className="text-xs font-bold px-2 py-0.5"
              style={{
                background: "rgba(255,107,43,0.15)",
                color: "#FF6B2B",
                border: "1px solid rgba(255,107,43,0.3)",
              }}
            >
              PRO
            </span>
          </div>
        </div>
      )}

      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <h3 className="font-heading text-xl font-bold text-text-primary leading-snug">
            {challenge.title}
          </h3>
          {status === "completed" && (
            <CheckCircle size={20} className="shrink-0 text-green-500 mt-0.5" />
          )}
          {status === "failed" && (
            <XCircle size={20} className="shrink-0 text-red-500 mt-0.5" />
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-text-secondary line-clamp-3 mb-4 leading-relaxed">
          {challenge.description}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-3 flex-wrap mb-4">
          <DifficultyBars level={challenge.difficulty} />

          <span className="text-xs text-text-muted uppercase tracking-wider font-medium">
            {CATEGORY_LABELS[challenge.category] ?? challenge.category}
          </span>

          <span className="flex items-center gap-1 text-xs text-text-muted">
            <Clock size={11} />
            {formatDuration(challenge.durationMinutes)}
          </span>

          <span
            className="flex items-center gap-1 text-xs font-bold px-2 py-0.5"
            style={{
              background: "rgba(255,107,43,0.12)",
              color: "#FFBDA3",
              border: "1px solid rgba(255,107,43,0.2)",
            }}
          >
            <Zap size={10} />
            {challenge.xpReward} XP
          </span>
        </div>

        {/* Countdown for active */}
        {status === "active" && countdown && (
          <p
            className="text-xs mb-4 font-mono"
            style={{ color: countdown === "Expired" ? "#EF4444" : "#FF6B2B" }}
          >
            {countdown}
          </p>
        )}

        {/* Completion form */}
        {showComplete && status === "active" && (
          <div className="mb-4 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-text-secondary">
                  Reflection <span className="text-forge-orange">*</span>
                </label>
                <span
                  className={`text-xs font-mono ${
                    reflection.length < 50 ? "text-text-disabled" : "text-green-500"
                  }`}
                >
                  {reflection.length}/50 min
                </span>
              </div>
              <textarea
                value={reflection}
                onChange={(e) => {
                  setReflection(e.target.value);
                  if (reflectionError) setReflectionError("");
                }}
                placeholder="What did you learn? What did it cost you? What changed?"
                rows={3}
                className="w-full bg-forge-input border border-forge-border px-3 py-2.5 text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-forge-orange transition-colors resize-none"
              />
              {reflectionError && (
                <p className="mt-1 text-xs text-red-400">{reflectionError}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleComplete}
                className="flex-1 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: "#22C55E" }}
              >
                Mark Complete
              </button>
              <button
                onClick={() => {
                  setShowComplete(false);
                  setReflection("");
                  setReflectionError("");
                }}
                className="px-4 py-2 text-sm text-text-muted border border-forge-border hover:border-forge-border-strong transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {!isLocked && (
          <div>
            {status === "none" && (
              <button
                onClick={() => onActivate(challenge.id)}
                disabled={isActivating}
                className="w-full py-2.5 text-sm font-bold text-forge-base bg-forge-orange hover:bg-forge-orange-hover disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
              >
                {isActivating ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : null}
                Start Challenge
              </button>
            )}

            {status === "active" && !showComplete && (
              <button
                onClick={() => setShowComplete(true)}
                className="w-full py-2.5 text-sm font-bold border transition-colors"
                style={{
                  color: "#22C55E",
                  borderColor: "#22C55E",
                  background: "transparent",
                }}
              >
                Complete Challenge
              </button>
            )}

            {status === "completed" && (
              <div className="py-2 text-center text-sm text-green-500 font-bold">
                Completed
              </div>
            )}

            {status === "failed" && (
              <div className="py-2 text-center text-sm text-red-400 font-bold">
                Failed — you can try again
              </div>
            )}
          </div>
        )}

        {isLocked && (
          <div className="py-2 text-center">
            <span className="text-xs text-text-muted">
              Upgrade to Pro to unlock
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
