"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Brain, Lock, X, ChevronRight, AlertCircle } from "lucide-react";
import { api } from "@/lib/trpc/client";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface MessagePart { text: string }
interface ChatMessage {
  id: string;
  role: "user" | "model";
  parts: MessagePart[];
  timestamp: string;
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const MEMORY_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  preference: { label: "Preference", color: "text-blue-400" },
  trigger:    { label: "Trigger",    color: "text-red-400"  },
  victory:    { label: "Victory",    color: "text-forge-orange" },
  fear:       { label: "Fear",       color: "text-yellow-400" },
  identity:   { label: "Identity",   color: "text-purple-400" },
  pattern:    { label: "Pattern",    color: "text-teal-400"  },
};

// ---------------------------------------------------------------------------
// Free-tier locked state
// ---------------------------------------------------------------------------
function LockedCoach() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 px-4">
      <div className="w-16 h-16 flex items-center justify-center border border-forge-border bg-forge-subtle">
        <Lock className="w-7 h-7 text-forge-orange" />
      </div>
      <div className="text-center max-w-sm">
        <h2 className="text-2xl font-bold text-text-primary mb-2">Your coach is waiting.</h2>
        <p className="text-text-muted text-sm leading-relaxed">
          The AI Forge Coach remembers everything — your why, your triggers, your wins.
          It builds a persistent memory of who you are and holds you to your highest standard.
          Available on Pro.
        </p>
      </div>
      <Link
        href="/upgrade"
        className="inline-flex items-center gap-2 px-6 py-3 bg-forge-orange hover:bg-forge-orange-hover text-forge-base font-semibold transition-colors"
      >
        Unlock with Pro <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Profile error state
// ---------------------------------------------------------------------------
function CoachError() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4 px-4">
      <div className="w-14 h-14 flex items-center justify-center border border-red-800/40 bg-red-950/30">
        <AlertCircle className="w-6 h-6 text-red-400" />
      </div>
      <div className="text-center max-w-sm">
        <h2 className="text-xl font-bold text-text-primary mb-2">Couldn&apos;t load coach</h2>
        <p className="text-text-muted text-sm leading-relaxed">
          There was a problem loading your profile. Check your connection and reload the page.
        </p>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="inline-flex items-center gap-2 px-5 py-2.5 border border-forge-border text-sm text-text-secondary hover:text-text-primary hover:border-forge-border-strong transition-colors"
      >
        Reload page
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Memory modal
// ---------------------------------------------------------------------------
function MemoryModal({
  open,
  onClose,
  memories,
}: {
  open: boolean;
  onClose: () => void;
  memories: Record<string, Array<{ id: string; content: string; created_at: Date | string | null }>>;
}) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const types = Object.keys(memories);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            className="relative bg-forge-subtle border border-forge-border w-full max-w-lg max-h-[70vh] flex flex-col overflow-hidden"
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 12 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-forge-border">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-forge-orange" />
                <span className="font-semibold text-text-primary text-sm">Coach Memory</span>
              </div>
              <button
                onClick={onClose}
                aria-label="Close memory modal"
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto p-5 flex flex-col gap-5">
              {types.length === 0 ? (
                <p className="text-text-muted text-sm text-center py-8">
                  No memories recorded yet. Start chatting to build your memory bank.
                </p>
              ) : (
                types.map((type) => {
                  const meta = MEMORY_TYPE_LABELS[type] ?? { label: type, color: "text-text-muted" };
                  return (
                    <div key={type}>
                      <h3 className={cn("text-xs font-semibold uppercase tracking-widest mb-2", meta.color)}>
                        {meta.label}
                      </h3>
                      <div className="flex flex-col gap-1.5">
                        {memories[type].map((m) => (
                          <div
                            key={m.id}
                            className="text-sm text-text-secondary bg-forge-elevated border border-forge-border px-3 py-2 leading-relaxed"
                          >
                            {m.content}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------
function MessageBubble({ msg, isStreaming }: { msg: ChatMessage; isStreaming?: boolean }) {
  const isUser = msg.role === "user";
  const text = msg.parts.map((p) => p.text).join("");

  return (
    <motion.div
      className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {!isUser && (
        <div className="w-7 h-7 border border-forge-border bg-forge-subtle flex items-center justify-center flex-shrink-0 mt-1">
          <span className="text-forge-orange text-xs font-bold">FC</span>
        </div>
      )}
      <div
        className={cn(
          "max-w-[72%] px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-forge-elevated border border-forge-border text-text-primary"
            : "bg-forge-overlay border border-forge-border-strong text-text-secondary"
        )}
      >
        <span className="whitespace-pre-wrap">{text}</span>
        {isStreaming && (
          <span className="ml-0.5 inline-block w-0.5 h-4 bg-forge-orange animate-pulse align-middle" />
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main coach page
// ---------------------------------------------------------------------------
export default function CoachPage() {
  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
  } = api.user.getProfile.useQuery();
  const { data: memories = {} } = api.user.getMemories.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Refs that carry the latest values into the unmount cleanup — avoids
  // calling setState on an unmounted component and avoids stale closures.
  const sessionIdRef = useRef<string | null>(null);
  const messagesRef  = useRef<ChatMessage[]>([]);

  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);
  useEffect(() => { messagesRef.current = messages; },  [messages]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  // Persist message to session — fire-and-forget
  const persistMessage = useCallback(
    async (msg: ChatMessage, sid: string | null) => {
      if (!sid) return;
      await fetch("/api/sessions/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "append", sessionId: sid, message: msg }),
      }).catch(() => {});
    },
    []
  );

  // Create a new coaching session
  const createSession = useCallback(async (firstMsg?: ChatMessage) => {
    const res = await fetch("/api/sessions/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", message: firstMsg }),
    });
    if (!res.ok) return null;
    const { sessionId: sid } = await res.json() as { sessionId: string };
    return sid;
  }, []);

  // Stream a response from the coach API
  const streamCoach = useCallback(
    async (msgs: ChatMessage[], sid: string | null) => {
      // Cancel any previous in-flight stream
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsStreaming(true);
      setStreamingText("");

      let full = "";
      try {
        const res = await fetch("/api/coach/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            session_type: "direct_chat",
            messages: msgs,
            context: {},
          }),
        });

        if (!res.ok || !res.body) throw new Error(`Stream failed (${res.status})`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let streamDone = false;

        while (!streamDone) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (raw === "[DONE]") { streamDone = true; break; }
            try {
              const parsed = JSON.parse(raw) as { text?: string; error?: string };
              if (parsed.error) {
                full = "I'm having trouble connecting right now. Please try again.";
                streamDone = true;
                break;
              }
              if (parsed.text) {
                full += parsed.text;
                setStreamingText(full);
              }
            } catch { /* skip malformed SSE line */ }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        full = "I'm having trouble connecting right now. Try again in a moment.";
      }

      const coachMsg: ChatMessage = {
        id: makeId(),
        role: "model",
        parts: [{ text: full || "..." }],
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, coachMsg]);
      setStreamingText("");
      setIsStreaming(false);

      persistMessage(coachMsg, sid);
    },
    [persistMessage]
  );

  // On mount: load history then stream opening greeting if none exists
  useEffect(() => {
    if (initialized || profileLoading) return;
    if (!profile) return;
    if (profile.tier === "free") { setInitialized(true); return; }

    setInitialized(true);

    (async () => {
      // Try to load the last session
      try {
        const res = await fetch("/api/sessions/coach?limit=50");
        if (res.ok) {
          const { sessionId: sid, messages: hist } = await res.json() as {
            sessionId: string | null;
            messages: ChatMessage[];
          };
          if (hist?.length > 0) {
            // Ensure loaded messages have stable ids (legacy sessions may lack them)
            setMessages(hist.map((m) => ({ ...m, id: m.id ?? makeId() })));
            setSessionId(sid);
            return;
          }
        }
      } catch { /* fall through to greeting */ }

      // No history — stream the opening greeting
      const greetingMsg: ChatMessage = {
        id: makeId(),
        role: "user",
        parts: [{ text: "Hello coach. I'm ready to begin." }],
        timestamp: new Date().toISOString(),
      };

      const sid = await createSession(greetingMsg);
      setSessionId(sid);
      setMessages([greetingMsg]);
      await streamCoach([greetingMsg], sid);
    })();
  }, [initialized, profileLoading, profile, createSession, streamCoach]);

  // Cleanup on unmount only (empty deps intentional) — trigger memory extraction
  // and abort any in-flight stream. Uses refs so it never goes stale and never
  // fires on intermediate re-renders caused by state changes like setSessionId.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      const sid = sessionIdRef.current;
      if (!sid) return;
      const msgs = messagesRef.current;
      const fullText = msgs
        .map((m) => m.parts.map((p) => p.text).join(""))
        .join("\n\n");
      if (fullText.trim()) {
        fetch("/api/sessions/coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "close", sessionId: sid, fullText }),
        }).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps — runs ONLY on unmount, never on sessionId/messages changes

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const userMsg: ChatMessage = {
      id: makeId(),
      role: "user",
      parts: [{ text }],
      timestamp: new Date().toISOString(),
    };

    let sid = sessionId;

    if (!sid) {
      // Fallback: session creation failed at mount — recover gracefully
      // Keep existing messages (greeting exchange) in the UI
      sid = await createSession(userMsg);
      setSessionId(sid);
      setMessages((prev) => [...prev, userMsg]);
    } else {
      setMessages((prev) => [...prev, userMsg]);
      persistMessage(userMsg, sid);
    }

    const newMsgs = messages.concat(userMsg);
    await streamCoach(newMsgs, sid);
  }, [input, isStreaming, sessionId, messages, createSession, persistMessage, streamCoach]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  // ── Loading spinner (profile fetch in-flight) ─────────────────────────────
  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="w-8 h-8 border-2 border-forge-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Profile fetch failed ──────────────────────────────────────────────────
  if (profileError) {
    return <CoachError />;
  }

  // ── Free tier (or no profile doc yet) ────────────────────────────────────
  if (!profile || profile.tier === "free") {
    return <LockedCoach />;
  }

  // Derived: true while session history is loading / greeting is being created,
  // before the first message appears and before streaming starts.
  const isInitializing = initialized && messages.length === 0 && !isStreaming;

  const memoryCount = Object.values(memories).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="flex flex-col h-[calc(100dvh-56px)]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-forge-border flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-text-primary">Forge Coach</h1>
          <p className="text-xs text-text-muted">Personalized AI · Remembers everything</p>
        </div>
        <button
          onClick={() => setMemoryOpen(true)}
          aria-label="View coach memory"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-forge-elevated hover:bg-forge-overlay border border-forge-border transition-colors text-xs text-text-secondary hover:text-text-primary"
        >
          <Brain className="w-3.5 h-3.5 text-forge-orange" />
          Memory
          {memoryCount > 0 && (
            <span className="ml-0.5 bg-forge-orange text-forge-base text-[10px] font-semibold px-1.5 py-0.5">
              {memoryCount}
            </span>
          )}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4">

        {/* Initializing — session/history loading */}
        {isInitializing && (
          <div className="flex justify-center py-12">
            <div className="flex items-center gap-3 text-text-muted text-sm">
              <div className="w-5 h-5 border-2 border-forge-orange border-t-transparent rounded-full animate-spin" />
              <span>Loading your session…</span>
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
        </AnimatePresence>

        {/* Streaming bubble */}
        {isStreaming && streamingText && (
          <MessageBubble
            msg={{
              id: "streaming",
              role: "model",
              parts: [{ text: streamingText }],
              timestamp: new Date().toISOString(),
            }}
            isStreaming
          />
        )}

        {/* Thinking indicator */}
        {isStreaming && !streamingText && (
          <motion.div
            className="flex gap-3 justify-start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-7 h-7 border border-forge-border bg-forge-subtle flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-forge-orange text-xs font-bold">FC</span>
            </div>
            <div className="bg-forge-overlay border border-forge-border px-4 py-3 flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 bg-forge-orange rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-forge-border px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-forge-base">
        <div className="flex items-end gap-3 max-w-3xl mx-auto">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Talk to your coach…"
            rows={1}
            disabled={isStreaming}
            className={cn(
              "flex-1 resize-none bg-forge-input border border-forge-border",
              "px-4 py-3 text-sm text-text-primary placeholder-text-disabled leading-relaxed",
              "focus:outline-none focus:border-forge-orange focus:ring-1 focus:ring-forge-orange transition-all",
              "disabled:opacity-50 min-h-[48px] max-h-40"
            )}
          />
          <button
            onClick={() => void handleSend()}
            disabled={!input.trim() || isStreaming}
            aria-label="Send message"
            className={cn(
              "flex-shrink-0 w-10 h-10 flex items-center justify-center transition-all",
              input.trim() && !isStreaming
                ? "bg-forge-orange hover:bg-forge-orange-hover text-forge-base"
                : "bg-forge-elevated border border-forge-border text-text-disabled cursor-not-allowed"
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-[10px] text-text-disabled mt-2">
          Shift+Enter for newline · Enter to send
        </p>
      </div>

      {/* Memory modal */}
      <MemoryModal
        open={memoryOpen}
        onClose={() => setMemoryOpen(false)}
        memories={memories}
      />
    </div>
  );
}
