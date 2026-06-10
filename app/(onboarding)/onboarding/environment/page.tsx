"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { api } from "@/lib/trpc/client";
import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";

// ---------------------------------------------------------------------------
// Question bank
// ---------------------------------------------------------------------------
const QUESTIONS: { q: string; opts: string[] }[] = [
  {
    q: "Where is your phone at night?",
    opts: ["On my nightstand", "In another room", "Under my pillow", "No set place"],
  },
  {
    q: "Do you have social media apps on your home screen?",
    opts: ["Yes, multiple", "Yes, one or two", "In folders", "Deleted them"],
  },
  {
    q: "Describe your workspace",
    opts: [
      "Clean desk, minimal distractions",
      "Somewhat cluttered",
      "Very cluttered / couch",
      "No dedicated workspace",
    ],
  },
  {
    q: "How accessible is junk food in your home?",
    opts: [
      "None in the house",
      "There but out of sight",
      "Visible on the counter",
      "Everywhere and easy to grab",
    ],
  },
  {
    q: "Where is your alarm?",
    opts: ["Phone next to my bed", "Across the room / separate alarm", "I don't use an alarm"],
  },
  {
    q: "Do you have books or learning material visible?",
    opts: ["Books on my desk / shelf", "Books stored away", "Digital only", "I don't read regularly"],
  },
  {
    q: "How easy is it to drink water in your home?",
    opts: [
      "Water bottle always filled and visible",
      "Have to go get water",
      "Usually forget to drink water",
    ],
  },
  {
    q: "Where is your gym bag or workout gear?",
    opts: [
      "Ready and visible",
      "Put away but accessible",
      "Have it but rarely use it",
      "I don't have workout gear",
    ],
  },
  {
    q: "Do you have a TV in your bedroom?",
    opts: ["Yes and I watch it most nights", "Yes but rarely", "No"],
  },
  {
    q: "How would you describe your phone notification settings?",
    opts: ["Most off — only essentials", "Many apps send notifications", "Everything is on"],
  },
  {
    q: "How would you describe your sleep environment?",
    opts: [
      "Dark, cool, no screens — optimized",
      "Pretty good but improvable",
      "Screens on / not dark enough",
      "Chaotic",
    ],
  },
  {
    q: "What is your biggest environmental trigger for your main bad habit?",
    opts: ["Social media / phone", "Food / kitchen", "Certain people or places", "Evening / night time", "Stress"],
  },
];

const TOTAL = QUESTIONS.length;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface AuditItem {
  id: string;
  item: string;
  category: string;
  done: boolean;
}

// ---------------------------------------------------------------------------
// Category pill colours
// ---------------------------------------------------------------------------
const CATEGORY_COLORS: Record<string, string> = {
  Sleep:     "text-blue-400   border-blue-800   bg-blue-950/40",
  Focus:     "text-purple-400 border-purple-800 bg-purple-950/40",
  Nutrition: "text-green-400  border-green-800  bg-green-950/40",
  Fitness:   "text-yellow-400 border-yellow-800 bg-yellow-950/40",
  Digital:   "text-red-400    border-red-800    bg-red-950/40",
  Mindset:   "text-orange-400 border-orange-800 bg-orange-950/40",
  General:   "text-text-muted border-forge-border bg-forge-subtle",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function EnvironmentPage() {
  const router = useRouter();
  const [step, setStep]     = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [phase, setPhase]   = useState<"questions" | "generating" | "results">("questions");
  const [items, setItems]   = useState<AuditItem[]>([]);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [entering, setEntering] = useState(false);

  const { data: profile }       = api.user.getProfile.useQuery(undefined, { retry: false });
  const { data: existingItems } = api.user.getEnvironmentItems.useQuery(undefined, { retry: false });
  const submitAudit        = api.user.submitEnvironmentAudit.useMutation();
  const markDone           = api.user.markEnvironmentItemDone.useMutation();
  const completeOnboarding = api.user.completeOnboarding.useMutation();

  useEffect(() => {
    if (profile && profile.onboardingStep !== "environment") {
      if (profile.onboardingStep === "mirror") router.replace("/onboarding/mirror");
      else if (profile.onboardingStep === "why") router.replace("/onboarding/why");
      else router.replace("/dashboard");
    }
  }, [profile, router]);

  useEffect(() => {
    if (existingItems && existingItems.length > 0) {
      setItems(existingItems as AuditItem[]);
      const done = new Set(
        (existingItems as AuditItem[]).filter((i) => i.done).map((i) => i.id)
      );
      setDoneIds(done);
      setPhase("results");
    }
  }, [existingItems]);

  const progress       = (step + 1) / TOTAL;
  const currentQ       = QUESTIONS[step];
  const selectedAnswer = answers[step];
  const isLastStep     = step === TOTAL - 1;

  function selectOption(opt: string) {
    setAnswers((prev) => ({ ...prev, [step]: opt }));
  }

  function goBack() {
    if (step > 0) setStep((s) => s - 1);
  }

  function goNext() {
    if (!selectedAnswer) return;
    if (isLastStep) handleSubmit();
    else setStep((s) => s + 1);
  }

  async function handleSubmit() {
    setPhase("generating");
    const formatted = QUESTIONS.map((q, i) => ({
      question: q.q,
      answer: answers[i] ?? "No answer",
    }));
    try {
      const result = await submitAudit.mutateAsync({ answers: formatted });
      setItems(result as AuditItem[]);
      setPhase("results");
    } catch {
      setPhase("results");
    }
  }

  async function handleMarkDone(id: string) {
    if (doneIds.has(id)) return;
    try {
      await markDone.mutateAsync({ itemId: id });
      setDoneIds((prev) => new Set(Array.from(prev).concat(id)));
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, done: true } : it)));
    } catch {
      setDoneIds((prev) => new Set(Array.from(prev).concat(id)));
    }
  }

  async function handleEnterForge() {
    setEntering(true);
    try {
      await completeOnboarding.mutateAsync();
    } catch {
      // In dev without Supabase this will fail — still navigate
    }
    router.push("/dashboard");
  }

  // ---------------------------------------------------------------------------
  // Generating screen
  // ---------------------------------------------------------------------------
  if (phase === "generating") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-forge-base px-4">
        <div className="flex flex-col items-center gap-6 text-center max-w-xs">
          {/* Animated dots */}
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2.5 w-2.5 rounded-full bg-forge-orange"
                style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
          </div>
          <div>
            <p className="text-base sm:text-lg font-semibold text-text-primary">
              Analysing your environment…
            </p>
            <p className="mt-1 text-sm text-text-muted leading-[1.65]">
              Generating personalised recommendations
            </p>
          </div>
          <p className="text-xs text-text-disabled">This usually takes 10–20 seconds</p>
        </div>
        <style>{`
          @keyframes bounce {
            0%, 80%, 100% { transform: translateY(0);   opacity: 0.3; }
            40%            { transform: translateY(-8px); opacity: 1;   }
          }
        `}</style>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Results screen
  // ---------------------------------------------------------------------------
  if (phase === "results") {
    const doneCount = doneIds.size;
    return (
      <div className="flex min-h-screen flex-col bg-forge-base">
        <div className="mx-auto w-full max-w-[680px] px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

          <OnboardingHeader step={3} />

          <div className="mb-2">
            <span className="text-xs tracking-[0.15em] uppercase text-forge-orange font-semibold">
              Complete
            </span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-text-primary leading-tight">
            Your Environment Plan
          </h1>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base leading-[1.65] text-text-secondary">
            These are your highest-leverage changes. Each one earns{" "}
            <span className="text-forge-orange font-medium">50 XP</span>.
          </p>

          <div className="mt-6 sm:mt-8 space-y-3">
            {items.length === 0 && (
              <p className="text-sm text-text-muted leading-[1.65]">
                No recommendations generated — you can proceed to the Forge.
              </p>
            )}
            {items.map((item, i) => {
              const isDone    = doneIds.has(item.id);
              const catClass  = CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS.General;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={`flex items-start gap-3 sm:gap-4 border px-4 py-4 sm:px-5 sm:py-5 transition-all duration-200 ${
                    isDone
                      ? "border-forge-border bg-forge-subtle opacity-60"
                      : "border-forge-border bg-forge-elevated hover:border-forge-border-strong"
                  }`}
                >
                  <span className="mt-0.5 shrink-0 min-w-[20px] text-sm font-bold text-text-muted tabular-nums">
                    {i + 1}.
                  </span>
                  <div className="flex-1 min-w-0 space-y-2">
                    <p
                      className={`text-sm leading-[1.65] ${
                        isDone ? "text-text-muted line-through" : "text-text-primary"
                      }`}
                    >
                      {item.item}
                    </p>
                    <span className={`inline-block border px-2 py-0.5 text-xs rounded-sm ${catClass}`}>
                      {item.category}
                    </span>
                  </div>
                  <button
                    onClick={() => handleMarkDone(item.id)}
                    disabled={isDone || markDone.isPending}
                    className={`shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center transition-all duration-200 ${
                      isDone
                        ? "text-green-500"
                        : "text-text-muted hover:text-forge-orange"
                    }`}
                    title={isDone ? "Done" : "Mark as done"}
                    aria-label={isDone ? "Completed" : `Mark "${item.item}" as done`}
                  >
                    <CheckCircle2 size={22} className={isDone ? "fill-green-500/20" : ""} />
                  </button>
                </motion.div>
              );
            })}
          </div>

          {/* XP summary */}
          {doneCount > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 flex items-center justify-between"
            >
              <p className="text-xs text-text-muted">
                {doneCount} of {items.length} completed
              </p>
              <p className="text-sm text-forge-orange font-medium">
                +{doneCount * 50} XP earned
              </p>
            </motion.div>
          )}

          <button
            onClick={handleEnterForge}
            disabled={entering}
            className="relative mt-8 sm:mt-10 w-full min-h-[56px] overflow-hidden bg-forge-orange text-base font-bold text-forge-base transition-all duration-200 hover:bg-forge-orange-hover hover:shadow-[0_0_28px_rgba(255,107,43,0.4)] disabled:opacity-60"
          >
            {entering ? "Entering the Forge…" : "Enter the Forge →"}
          </button>
          <p className="mt-3 text-center text-xs text-text-muted">
            +200 XP for completing onboarding
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Questions screen
  // ---------------------------------------------------------------------------
  return (
    <div className="flex min-h-screen flex-col bg-forge-base">

      {/* Progress bar — pinned to top */}
      <div className="h-1 w-full bg-forge-border shrink-0">
        <motion.div
          className="h-full bg-forge-orange"
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ ease: "easeOut", duration: 0.35 }}
        />
      </div>

      <div className="mx-auto flex w-full max-w-[640px] flex-1 flex-col px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

        {/* Condensed step header (no full OnboardingHeader here — we have the progress bar) */}
        <div className="mb-6 sm:mb-8 shrink-0 flex items-center justify-between">
          <div>
            <p className="text-xs tracking-[0.15em] uppercase text-forge-orange font-semibold">
              Step 3 of 3
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Question {step + 1} of {TOTAL}
            </p>
          </div>
          <p className="font-heading text-sm font-bold tracking-widest text-forge-orange uppercase">
            MINDFORGE
          </p>
        </div>

        {/* Question */}
        <div className="flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-text-primary leading-snug mb-5 sm:mb-6">
                {currentQ.q}
              </h2>

              <div className="space-y-2.5 sm:space-y-3">
                {currentQ.opts.map((opt) => {
                  const isSelected = selectedAnswer === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => selectOption(opt)}
                      className={`w-full min-h-[52px] flex items-center border px-4 py-3 text-left text-sm leading-[1.55] transition-all duration-200 ${
                        isSelected
                          ? "border-forge-orange bg-[#1A0A04] text-text-primary shadow-[0_0_0_1px_#FF6B2B]"
                          : "border-[#2A2927] bg-[#111110] text-text-secondary hover:bg-[#1A1918] hover:border-[#3D3B39]"
                      }`}
                    >
                      <span
                        className={`mr-3 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${
                          isSelected
                            ? "border-forge-orange bg-forge-orange"
                            : "border-[#3D3B39]"
                        }`}
                      >
                        {isSelected && (
                          <span className="h-1.5 w-1.5 rounded-full bg-forge-base" />
                        )}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="mt-6 sm:mt-8 shrink-0 flex items-center gap-3">
          {step > 0 && (
            <button
              onClick={goBack}
              className="min-h-[48px] min-w-[80px] sm:min-w-[96px] border border-forge-border px-4 sm:px-6 text-sm text-text-muted transition-all duration-200 hover:border-forge-border-strong hover:text-text-primary"
            >
              ← Back
            </button>
          )}
          <button
            onClick={goNext}
            disabled={!selectedAnswer}
            className="flex-1 min-h-[48px] bg-forge-orange text-sm font-bold text-forge-base transition-all duration-200 hover:bg-forge-orange-hover hover:shadow-[0_0_20px_rgba(255,107,43,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLastStep ? "Submit →" : "Next →"}
          </button>
        </div>

        {/* Keyboard hint */}
        <p className="mt-3 text-center text-xs text-text-disabled">
          Select an option to continue
        </p>
      </div>
    </div>
  );
}
