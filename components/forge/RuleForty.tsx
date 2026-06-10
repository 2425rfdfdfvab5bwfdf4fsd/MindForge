"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useStreamingResponse } from "@/lib/hooks/useStreamingResponse";

// ---------------------------------------------------------------------------
// Daily auto-trigger limit helpers (localStorage)
// ---------------------------------------------------------------------------

const STORAGE_KEY_PREFIX = "rule_forty_auto_";

function todayKey() {
  return STORAGE_KEY_PREFIX + new Date().toISOString().split("T")[0];
}

export function canAutoTrigger(): boolean {
  if (typeof window === "undefined") return false;
  const count = parseInt(localStorage.getItem(todayKey()) ?? "0", 10);
  return count < 3;
}

export function recordAutoTrigger(): void {
  if (typeof window === "undefined") return;
  const key = todayKey();
  const count = parseInt(localStorage.getItem(key) ?? "0", 10);
  localStorage.setItem(key, String(count + 1));
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RuleFortyTriggeredBy = "auto_habit" | "auto_checkin" | "manual";

interface RuleFortyProps {
  open: boolean;
  onClose: () => void;
  triggeredBy?: RuleFortyTriggeredBy;
  habitId?: string;
  triggerContext?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RuleForty({
  open,
  onClose,
  triggeredBy = "manual",
  habitId,
  triggerContext,
}: RuleFortyProps) {
  const { streamedText, isStreaming, isComplete, startStream, reset } =
    useStreamingResponse();

  const hasStreamed = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Portal mount guard
  useEffect(() => { setMounted(true); }, []);

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Block Escape key while open
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") e.preventDefault();
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [open]);

  // Fade text in 100ms after overlay appears, then start stream
  useEffect(() => {
    if (open && !hasStreamed.current) {
      hasStreamed.current = true;
      reset();
      setTextVisible(false);

      const fadeTimer = setTimeout(() => {
        setTextVisible(true);
        // Start streaming for auto-triggers; manual shows buttons immediately
        if (triggeredBy !== "manual") {
          startStream("/api/coach/stream", {
            session_type: "forty_percent_rule",
            messages: [
              {
                role: "user",
                parts: [{ text: triggerContext ?? "I feel like I can't continue." }],
              },
            ],
            context: {
              trigger_context: triggerContext ?? "",
            },
          });
        }
      }, 100);

      return () => clearTimeout(fadeTimer);
    }

    if (!open) {
      hasStreamed.current = false;
      setTextVisible(false);
      setSubmitting(false);
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Auto-scroll as text streams
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [streamedText]);

  const recordChoice = async (choice: "took_step" | "declined") => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/rule-forty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          choice,
          triggered_by: triggeredBy,
          habit_id: habitId ?? undefined,
        }),
      });
    } catch {
      // Non-blocking — close regardless
    }
    onClose();
  };

  // For manual trigger: buttons show immediately (no stream, no wait)
  const showButtons =
    triggeredBy === "manual" ? textVisible : isComplete;

  if (!mounted) return null;

  const overlay = (
    <AnimatePresence>
      {open && (
        <>
          {/* ----------------------------------------------------------------
              Background: pure #000, instant snap — NO fade animation
          ---------------------------------------------------------------- */}
          <div
            className="fixed inset-0 z-[100] bg-black"
            style={{ animation: "none" }}
            // clicking outside does nothing — per PRD
          />

          {/* ----------------------------------------------------------------
              Content panel — fades in 100ms after overlay (textVisible state)
          ---------------------------------------------------------------- */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-6">
            <div className="w-full max-w-lg">
              <AnimatePresence>
                {textVisible && (
                  <motion.div
                    key="content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.1 }}
                  >
                    {/* Heading */}
                    <h1 className="mb-3 text-center text-4xl font-black text-forge-orange uppercase tracking-widest leading-tight">
                      YOUR MIND IS<br />LYING TO YOU
                    </h1>

                    {/* Subheading */}
                    <p className="mb-8 text-center text-xl text-white/70">
                      You&apos;ve only used 40% of your capacity.
                    </p>

                    {/* Coach stream area — only for auto-triggers */}
                    {triggeredBy !== "manual" && (
                      <div className="mb-8 max-h-[40vh] overflow-y-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4 text-sm leading-relaxed text-gray-300">
                        {/* Thinking dots */}
                        {isStreaming && !streamedText && (
                          <span className="flex gap-1.5">
                            {[0, 1, 2].map((i) => (
                              <span
                                key={i}
                                className="inline-block h-1.5 w-1.5 rounded-full bg-forge-orange"
                                style={{
                                  animation: `ruleFortyPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                                }}
                              />
                            ))}
                          </span>
                        )}

                        {streamedText && (
                          <span className="whitespace-pre-wrap">
                            {streamedText}
                            {isStreaming && (
                              <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-forge-orange align-middle" />
                            )}
                          </span>
                        )}
                        <div ref={bottomRef} />
                      </div>
                    )}

                    {/* Buttons — appear after stream or immediately for manual */}
                    <AnimatePresence>
                      {showButtons && (
                        <motion.div
                          key="buttons"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex flex-col gap-3"
                        >
                          <button
                            onClick={() => recordChoice("took_step")}
                            disabled={submitting}
                            style={{ backgroundColor: "#FF6B2B", color: "#000" }}
                            className="w-full rounded-none py-4 text-base font-black uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-50"
                          >
                            I&apos;ll take that step
                          </button>

                          <button
                            onClick={() => recordChoice("declined")}
                            disabled={submitting}
                            className="w-full rounded-none border py-4 text-base font-bold uppercase tracking-widest text-white/50 transition-colors hover:text-white disabled:opacity-50"
                            style={{ borderColor: "#3D3B39" }}
                          >
                            I still can&apos;t
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(overlay, document.body);
}

// Inject pulse keyframes once
if (typeof document !== "undefined") {
  const styleId = "rule-forty-styles";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      @keyframes ruleFortyPulse {
        0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
        40%           { opacity: 1;   transform: scale(1);   }
      }
    `;
    document.head.appendChild(style);
  }
}
