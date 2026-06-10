"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useStreamingResponse } from "@/lib/hooks/useStreamingResponse";

interface RuleFortyProps {
  open: boolean;
  onClose: () => void;
  triggerContext?: string;
  cookieJarEntry?: string;
  whyStatement?: string;
  forgeScore?: number;
}

export function RuleForty({
  open,
  onClose,
  triggerContext,
  cookieJarEntry,
  whyStatement,
  forgeScore,
}: RuleFortyProps) {
  const { streamedText, isStreaming, isComplete, startStream, reset } =
    useStreamingResponse();
  const hasStreamed = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when overlay open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Start stream once when opened
  useEffect(() => {
    if (open && !hasStreamed.current) {
      hasStreamed.current = true;
      reset();
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
          cookie_jar_entry: cookieJarEntry ?? "",
          why_statement: whyStatement ?? "",
          forge_score: forgeScore ?? 0,
        },
      });
    }
    if (!open) {
      hasStreamed.current = false;
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Scroll to bottom as text streams
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [streamedText]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85"
            onClick={isComplete ? onClose : undefined}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-xl -translate-y-1/2 border-2 border-forge-orange bg-forge-base p-8"
          >
            {/* Close — only after stream completes */}
            {isComplete && (
              <button
                onClick={onClose}
                className="absolute right-4 top-4 text-text-muted hover:text-text-primary"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            )}

            {/* Heading */}
            <p className="mb-6 font-heading text-xl font-bold text-forge-orange uppercase tracking-widest">
              YOUR MIND IS LYING TO YOU
            </p>

            {/* Body */}
            <div className="max-h-[55vh] overflow-y-auto text-sm leading-relaxed text-text-secondary">
              {/* Waiting dots */}
              {isStreaming && !streamedText && (
                <span className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="inline-block h-1.5 w-1.5 rounded-full bg-forge-orange"
                      style={{
                        animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
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

            {/* Footer */}
            {isComplete && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-6 border-t border-forge-border pt-4"
              >
                <button
                  onClick={onClose}
                  className="w-full bg-forge-orange py-3 text-sm font-bold text-forge-base hover:bg-forge-orange-hover"
                >
                  I understand. Back to work.
                </button>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Inject keyframes into the document once
if (typeof document !== "undefined") {
  const styleId = "rule-forty-styles";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      @keyframes pulse-dot {
        0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
        40% { opacity: 1; transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
  }
}
