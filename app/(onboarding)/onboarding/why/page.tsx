"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { api } from "@/lib/trpc/client";
import { useStreamingResponse } from "@/hooks/useStreamingResponse";
import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";

const MAX_TURNS = 8;
const MAX_REFINEMENTS = 2;
const OPENING_MESSAGE =
  "What's the one thing you want most to change or achieve? Be specific — not 'be better', but what does better actually look like for you?";
const WHY_PATTERN = /you want to .+/i;

type Role = "user" | "coach";
interface Message {
  role: Role;
  content: string;
}

function extractWhyStatement(text: string): string | null {
  const match = text.match(/you want to [^.!?\n]+[.!?]?/i);
  return match ? match[0].trim() : null;
}

function CoachBubble({ content, isStreaming }: { content: string; isStreaming?: boolean }) {
  return (
    <div className="flex justify-start">
      <div
        className="max-w-[90%] sm:max-w-[82%] border border-[#1A3A6E] bg-forge-subtle px-4 py-3 sm:px-5 sm:py-4 text-sm text-text-secondary"
        style={{ lineHeight: "1.75" }}
      >
        <span className="whitespace-pre-wrap">{content}</span>
        {isStreaming && (
          <span className="ml-1 inline-block h-3.5 w-0.5 animate-pulse bg-forge-orange align-middle" />
        )}
      </div>
    </div>
  );
}

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div
        className="max-w-[90%] sm:max-w-[82%] border border-forge-border bg-forge-elevated px-4 py-3 sm:px-5 sm:py-4 text-sm text-text-primary"
        style={{ lineHeight: "1.75" }}
      >
        <span className="whitespace-pre-wrap">{content}</span>
      </div>
    </div>
  );
}

export default function WhyPage() {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [turnCount, setTurnCount] = useState(0);
  const [refinements, setRefinements] = useState(0);

  const [whyStatement, setWhyStatement] = useState<string | null>(null);
  const [whyAccepted, setWhyAccepted] = useState(false);
  const [identityDecl, setIdentityDecl] = useState("");
  const [identitySubmitted, setIdentitySubmitted] = useState(false);
  const [showBadge, setShowBadge] = useState(false);

  const { streamedText, isStreaming, isComplete, startStream, reset } =
    useStreamingResponse();
  const [streamingFor, setStreamingFor] = useState<"opening" | "reply" | null>(null);

  const { data: profile } = api.user.getProfile.useQuery(undefined, { retry: false });
  const updateWhy    = api.user.updateWhy.useMutation();
  const updateProfile = api.user.updateProfile.useMutation();
  const awardBadge   = api.user.awardBadge.useMutation();

  useEffect(() => {
    if (profile && profile.onboardingStep !== "why") {
      if (profile.onboardingStep === "mirror") router.replace("/onboarding/mirror");
      else router.replace("/onboarding/environment");
    }
  }, [profile, router]);

  useEffect(() => {
    setStreamingFor("opening");
    startStream("/api/coach/stream", {
      session_type: "why_excavation",
      messages: [{ role: "user", parts: [{ text: "__init__" }] }],
      context: {},
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isComplete && streamingFor === "opening" && streamedText) {
      setMessages([{ role: "coach", content: OPENING_MESSAGE }]);
      reset();
      setStreamingFor(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete, streamingFor]);

  useEffect(() => {
    if (isComplete && streamingFor === "reply" && streamedText) {
      const coachMsg: Message = { role: "coach", content: streamedText };
      setMessages((prev) => [...prev, coachMsg]);

      if (!whyStatement && WHY_PATTERN.test(streamedText)) {
        const extracted = extractWhyStatement(streamedText);
        if (extracted) setWhyStatement(extracted);
      }

      if (!whyStatement && turnCount >= 6) {
        setWhyStatement(
          streamedText.match(/you want to [^.!?\n]+[.!?]?/i)?.[0]?.trim() ??
            "You want to become the best version of yourself."
        );
      }

      reset();
      setStreamingFor(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete, streamingFor]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamedText]);

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  }

  const buildHistory = useCallback(
    (msgs: Message[]) =>
      msgs.map((m) => ({
        role: m.role === "coach" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    []
  );

  async function handleSend() {
    const text = input.trim();
    if (!text || isStreaming || turnCount >= MAX_TURNS) return;

    const userMsg: Message = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setTurnCount((t) => t + 1);
    reset();
    setStreamingFor("reply");

    await startStream("/api/coach/stream", {
      session_type: "why_excavation",
      messages: buildHistory(next),
      context: {},
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleRefine() {
    if (refinements >= MAX_REFINEMENTS) return;
    setRefinements((r) => r + 1);
    setWhyStatement(null);

    const refineMsg: Message = {
      role: "user",
      content: "That's not quite right. Let's go deeper.",
    };
    const next = [...messages, refineMsg];
    setMessages(next);
    setTurnCount((t) => t + 1);
    reset();
    setStreamingFor("reply");

    await startStream("/api/coach/stream", {
      session_type: "why_excavation",
      messages: buildHistory(next),
      context: {},
    });
  }

  async function handleAcceptWhy() {
    setWhyAccepted(true);
  }

  async function handleIdentitySubmit() {
    if (!identityDecl.trim() || !whyStatement) return;
    setIdentitySubmitted(true);

    const fullDeclaration = identityDecl.startsWith("I am")
      ? identityDecl
      : `I am someone who ${identityDecl}`;

    await updateWhy.mutateAsync({ whyStatement, identityDeclaration: fullDeclaration });
    await awardBadge.mutateAsync({ badgeKey: "identity_locked" });
    setShowBadge(true);
  }

  async function handleContinue() {
    await updateProfile.mutateAsync({ onboardingStep: "environment" });
    router.push("/onboarding/environment");
  }

  const canSend =
    !isStreaming && input.trim().length > 0 && turnCount < MAX_TURNS && !whyStatement;

  return (
    <div className="flex min-h-screen flex-col bg-forge-base">
      <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

        {/* Header */}
        <OnboardingHeader step={2} />

        {/* Title */}
        <div className="mb-5 sm:mb-8 shrink-0">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-text-primary leading-tight">
            Excavate Your Why
          </h1>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base leading-[1.65] text-text-secondary">
            Your coach will guide you to the motivation that won't break.
          </p>
        </div>

        {/* Messages */}
        <div
          className="mb-4 flex flex-1 flex-col gap-3 sm:gap-4 overflow-y-auto scroll-smooth"
          style={{ maxHeight: "clamp(280px, 52vh, 540px)", minHeight: 0 }}
        >
          {messages.map((msg, i) =>
            msg.role === "coach" ? (
              <CoachBubble key={i} content={msg.content} />
            ) : (
              <UserBubble key={i} content={msg.content} />
            )
          )}

          {/* Streaming coach reply */}
          {isStreaming && streamingFor === "reply" && streamedText && (
            <CoachBubble content={streamedText} isStreaming />
          )}

          {/* Opening stream */}
          {isStreaming && streamingFor === "opening" && (
            <CoachBubble content={streamedText || ""} isStreaming />
          )}

          {/* Waiting dots */}
          {isStreaming && !streamedText && (
            <div className="flex justify-start">
              <div className="border border-[#1A3A6E] bg-forge-subtle px-5 py-3.5">
                <span className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="inline-block h-1.5 w-1.5 rounded-full bg-forge-orange"
                      style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
                    />
                  ))}
                </span>
              </div>
            </div>
          )}

          {/* Why Statement Card */}
          <AnimatePresence>
            {whyStatement && !whyAccepted && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="border-2 border-forge-orange px-5 py-5 sm:px-6 sm:py-6"
                style={{ background: "#1A0A04" }}
              >
                <p className="mb-2 text-xs tracking-[0.15em] uppercase text-forge-orange font-semibold">
                  Your Why Statement
                </p>
                <p className="mb-5 sm:mb-6 text-sm sm:text-base font-medium text-text-primary capitalize leading-[1.65]">
                  {whyStatement}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleAcceptWhy}
                    className="flex-1 min-h-[48px] bg-forge-orange text-sm font-bold text-forge-base transition-all duration-200 hover:bg-forge-orange-hover"
                  >
                    This is my truth — Accept
                  </button>
                  {refinements < MAX_REFINEMENTS && (
                    <button
                      onClick={handleRefine}
                      disabled={isStreaming}
                      className="flex-1 min-h-[48px] border border-forge-border text-sm text-text-muted transition-all duration-200 hover:border-forge-border-strong hover:text-text-primary disabled:opacity-40"
                    >
                      Refine it ({MAX_REFINEMENTS - refinements} left)
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Identity Declaration */}
          <AnimatePresence>
            {whyAccepted && !identitySubmitted && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 sm:space-y-4"
              >
                <p className="text-sm leading-[1.65] text-text-secondary">
                  Now lock it in. Complete this statement:
                </p>
                <p className="font-heading text-base font-semibold text-text-primary">
                  I am someone who…
                </p>
                <input
                  type="text"
                  value={identityDecl}
                  onChange={(e) => setIdentityDecl(e.target.value)}
                  placeholder="never quits when it matters most"
                  className="w-full min-h-[48px] border border-forge-border bg-forge-input px-4 py-3 text-sm text-text-primary placeholder:text-text-disabled outline-none transition-all duration-200 focus:border-forge-orange focus:ring-1 focus:ring-forge-orange"
                  onKeyDown={(e) => { if (e.key === "Enter") handleIdentitySubmit(); }}
                />
                <button
                  onClick={handleIdentitySubmit}
                  disabled={!identityDecl.trim() || updateWhy.isPending}
                  className="w-full min-h-[48px] bg-forge-orange text-sm font-bold text-forge-base transition-all duration-200 hover:bg-forge-orange-hover disabled:opacity-50"
                >
                  {updateWhy.isPending ? "Locking in…" : "Lock My Identity →"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Identity Locked Badge */}
          <AnimatePresence>
            {showBadge && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-4 py-6 sm:py-8"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -15 }}
                  animate={{ scale: [0, 1.15, 1], rotate: [-15, 5, 0] }}
                  transition={{ type: "spring", stiffness: 250, damping: 12 }}
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-forge-orange shadow-[0_0_32px_rgba(255,107,43,0.4)]"
                >
                  <ShieldCheck size={40} className="text-forge-base" />
                </motion.div>
                <div className="text-center">
                  <p className="font-heading text-lg sm:text-xl font-bold text-text-primary">
                    Identity Locked
                  </p>
                  <p className="mt-1 text-sm text-text-muted leading-[1.65]">
                    You know who you are now. That changes everything.
                  </p>
                </div>
                <button
                  onClick={handleContinue}
                  disabled={updateProfile.isPending}
                  className="mt-2 w-full max-w-xs min-h-[48px] bg-forge-orange text-sm font-bold text-forge-base transition-all duration-200 hover:bg-forge-orange-hover hover:shadow-[0_0_20px_rgba(255,107,43,0.35)] disabled:opacity-50"
                >
                  {updateProfile.isPending ? "Saving…" : "Continue to Step 3 →"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        {!whyStatement && !whyAccepted && (
          <div className="shrink-0 border-t border-forge-border pt-4">
            <div className="flex gap-2 sm:gap-3">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Your response… (Enter to send)"
                rows={1}
                disabled={isStreaming}
                className="flex-1 min-h-[44px] resize-none border border-forge-border bg-forge-input px-3 sm:px-4 py-3 text-sm text-text-primary placeholder:text-text-disabled outline-none transition-all duration-200 focus:border-forge-orange focus:ring-1 focus:ring-forge-orange disabled:opacity-50"
                style={{ lineHeight: "1.65", overflow: "hidden" }}
              />
              <button
                onClick={handleSend}
                disabled={!canSend}
                className="shrink-0 min-h-[44px] min-w-[64px] sm:min-w-[72px] bg-forge-orange px-4 sm:px-6 text-sm font-bold text-forge-base transition-all duration-200 hover:bg-forge-orange-hover disabled:opacity-50"
              >
                Send
              </button>
            </div>
            {turnCount > 0 && (
              <p className="mt-2 text-right text-xs text-text-muted">
                Turn {turnCount} of {MAX_TURNS}
              </p>
            )}
          </div>
        )}

        <style>{`
          @keyframes pulse {
            0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
            40%            { opacity: 1;   transform: scale(1);   }
          }
        `}</style>
      </div>
    </div>
  );
}
