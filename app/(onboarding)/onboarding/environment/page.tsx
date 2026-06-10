"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { api } from "@/lib/trpc/client";

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
  Sleep: "text-blue-400 border-blue-800 bg-blue-950/40",
  Focus: "text-purple-400 border-purple-800 bg-purple-950/40",
  Nutrition: "text-green-400 border-green-800 bg-green-950/40",
  Fitness: "text-yellow-400 border-yellow-800 bg-yellow-950/40",
  Digital: "text-red-400 border-red-800 bg-red-950/40",
  Mindset: "text-orange-400 border-orange-800 bg-orange-950/40",
  General: "text-text-muted border-forge-border bg-forge-subtle",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function EnvironmentPage() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0-11
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [phase, setPhase] = useState<"questions" | "generating" | "results">("questions");
  const [items, setItems] = useState<AuditItem[]>([]);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [entering, setEntering] = useState(false);

  // tRPC
  const { data: profile } = api.user.getProfile.useQuery(undefined, { retry: false });
  const { data: existingItems } = api.user.getEnvironmentItems.useQuery(undefined, {
    retry: false,
  });
  const submitAudit = api.user.submitEnvironmentAudit.useMutation();
  const markDone = api.user.markEnvironmentItemDone.useMutation();
  const completeOnboarding = api.user.completeOnboarding.useMutation();

  // Redirect guard
  useEffect(() => {
    if (profile && profile.onboardingStep !== "environment") {
      if (profile.onboardingStep === "mirror") router.replace("/onboarding/mirror");
      else if (profile.onboardingStep === "why") router.replace("/onboarding/why");
      else router.replace("/dashboard");
    }
  }, [profile, router]);

  // Resume if items already exist (page refresh after submit)
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

  const progress = (step + 1) / TOTAL;
  const currentQ = QUESTIONS[step];
  const selectedAnswer = answers[step];
  const isLastStep = step === TOTAL - 1;

  function selectOption(opt: string) {
    setAnswers((prev) => ({ ...prev, [step]: opt }));
  }

  function goBack() {
    if (step > 0) setStep((s) => s - 1);
  }

  function goNext() {
    if (!selectedAnswer) return;
    if (isLastStep) {
      handleSubmit();
    } else {
      setStep((s) => s + 1);
    }
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
      // Still move to results with empty state
      setPhase("results");
    }
  }

  async function handleMarkDone(id: string) {
    if (doneIds.has(id)) return;
    try {
      await markDone.mutateAsync({ itemId: id });
      setDoneIds((prev) => new Set(Array.from(prev).concat(id)));
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, done: true } : it))
      );
    } catch {
      // Optimistic update anyway in dev
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
      <div className="flex min-h-screen items-center justify-center bg-forge-base">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2 w-2 rounded-full bg-forge-orange"
                style={{
                  animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
          <p className="text-base text-text-secondary">
            Analysing your environment…
          </p>
          <p className="text-xs text-text-muted">Generating personalised recommendations</p>
          <style>{`
            @keyframes bounce {
              0%, 80%, 100% { transform: translateY(0); opacity: 0.3; }
              40% { transform: translateY(-8px); opacity: 1; }
            }
          `}</style>
        </div>
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
        <div className="mx-auto w-full max-w-[640px] px-6 py-12">
          <p className="mb-2 text-xs uppercase tracking-widest text-text-muted">
            Step 3 of 3 — Complete
          </p>
          <h1 className="font-heading text-4xl font-bold text-text-primary">
            Your Environment Plan
          </h1>
          <p className="mt-3 text-base text-text-secondary">
            These are your highest-leverage changes. Each one earns 50 XP.
          </p>

          <div className="mt-8 space-y-3">
            {items.length === 0 && (
              <p className="text-sm text-text-muted">
                No recommendations generated — you can proceed to the Forge.
              </p>
            )}
            {items.map((item, i) => {
              const isDone = doneIds.has(item.id);
              const catClass =
                CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS.General;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={`flex items-start gap-4 border p-5 transition-colors ${
                    isDone
                      ? "border-forge-border bg-forge-subtle opacity-60"
                      : "border-forge-border bg-forge-elevated"
                  }`}
                >
                  <span className="mt-0.5 shrink-0 text-sm font-bold text-text-muted">
                    {i + 1}.
                  </span>
                  <div className="flex-1 space-y-2">
                    <p
                      className={`text-sm leading-relaxed ${
                        isDone
                          ? "text-text-muted line-through"
                          : "text-text-primary"
                      }`}
                    >
                      {item.item}
                    </p>
                    <span
                      className={`inline-block border px-2 py-0.5 text-xs ${catClass}`}
                    >
                      {item.category}
                    </span>
                  </div>
                  <button
                    onClick={() => handleMarkDone(item.id)}
                    disabled={isDone || markDone.isPending}
                    className={`shrink-0 transition-all ${
                      isDone
                        ? "text-green-500"
                        : "text-text-muted hover:text-forge-orange"
                    }`}
                    title={isDone ? "Done" : "Mark as done"}
                  >
                    <CheckCircle2
                      size={22}
                      className={isDone ? "fill-green-500/20" : ""}
                    />
                  </button>
                </motion.div>
              );
            })}
          </div>

          {/* XP summary */}
          {doneCount > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-right text-sm text-text-muted"
            >
              {doneCount} done ·{" "}
              <span className="text-forge-orange">+{doneCount * 50} XP earned</span>
            </motion.p>
          )}

          <button
            onClick={handleEnterForge}
            disabled={entering}
            className="relative mt-10 w-full overflow-hidden bg-forge-orange py-4 text-base font-bold text-forge-base transition-opacity hover:bg-forge-orange-hover disabled:opacity-60"
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
      {/* Progress bar */}
      <div className="h-1 w-full bg-forge-border">
        <motion.div
          className="h-full bg-forge-orange"
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ ease: "easeOut", duration: 0.35 }}
        />
      </div>

      <div className="mx-auto flex w-full max-w-[640px] flex-1 flex-col justify-center px-6 py-12">
        <p className="mb-6 text-xs uppercase tracking-widest text-text-muted">
          Step 3 of 3 · Question {step + 1} of {TOTAL}
        </p>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="font-heading text-2xl font-bold text-text-primary">
              {currentQ.q}
            </h2>

            <div className="mt-6 space-y-3">
              {currentQ.opts.map((opt) => {
                const isSelected = selectedAnswer === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => selectOption(opt)}
                    className={`w-full border p-4 text-left text-sm transition-colors ${
                      isSelected
                        ? "border-forge-orange bg-[#1A0A04] text-text-primary"
                        : "border-[#2A2927] bg-[#111110] text-text-secondary hover:bg-[#1A1918]"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-8 flex items-center gap-3">
          {step > 0 && (
            <button
              onClick={goBack}
              className="border border-forge-border px-6 py-3 text-sm text-text-muted hover:border-forge-border-strong hover:text-text-primary"
            >
              ← Back
            </button>
          )}
          <button
            onClick={goNext}
            disabled={!selectedAnswer}
            className="flex-1 bg-forge-orange py-3 text-sm font-bold text-forge-base hover:bg-forge-orange-hover disabled:opacity-40"
          >
            {isLastStep ? "Submit →" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}
