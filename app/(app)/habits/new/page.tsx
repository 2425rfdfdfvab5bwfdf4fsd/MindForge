"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { api } from "@/lib/trpc/client";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CATEGORY_OPTIONS = [
  { value: "health", label: "Health" },
  { value: "mind", label: "Mind" },
  { value: "avoid", label: "Avoid" },
  { value: "perform", label: "Perform" },
] as const;

const TYPE_OPTIONS = [
  { value: "build", label: "Build — I want to do this more" },
  { value: "avoid", label: "Avoid — I want to stop doing this" },
] as const;

const FREQ_OPTIONS = [
  { value: "daily", label: "Every day" },
  { value: "weekdays", label: "Weekdays only (Mon–Fri)" },
  { value: "custom", label: "Custom days" },
] as const;

export default function NewHabitPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<"health" | "mind" | "avoid" | "perform">("health");
  const [habitType, setHabitType] = useState<"build" | "avoid">("build");
  const [targetFrequency, setTargetFrequency] = useState<"daily" | "weekdays" | "custom">("daily");
  const [targetDays, setTargetDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [error, setError] = useState<string | null>(null);

  const createHabit = api.habits.create.useMutation({
    onSuccess: () => {
      router.push("/habits");
    },
    onError: (err) => {
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.upgradeRequired) {
          setError("Free tier limit reached. Upgrade to Pro to add more habits.");
          return;
        }
      } catch {
        // not JSON
      }
      setError(err.message);
    },
  });

  function toggleDay(day: number) {
    setTargetDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Habit name is required.");
      return;
    }

    if (targetFrequency === "custom" && targetDays.length === 0) {
      setError("Select at least one day for a custom schedule.");
      return;
    }

    await createHabit.mutateAsync({
      name: name.trim(),
      category,
      habitType,
      targetFrequency,
      targetDays: targetFrequency === "custom" ? targetDays : undefined,
    });
  }

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 py-8 sm:py-10">
      {/* Back */}
      <Link
        href="/habits"
        className="mb-8 flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary"
      >
        <ChevronLeft size={16} />
        Back to Habits
      </Link>

      <h1 className="mb-8 font-heading text-3xl font-bold text-text-primary">
        New Habit
      </h1>

      <form onSubmit={handleSubmit} className="space-y-7">
        {/* Name */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-text-secondary">
            Habit name
            <span className="ml-1 text-xs text-text-muted">({60 - name.length} chars left)</span>
          </label>
          <input
            type="text"
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Read for 30 minutes"
            className="w-full border border-forge-border bg-forge-input px-4 py-3 text-sm text-text-primary placeholder-text-disabled outline-none focus:border-forge-orange focus:ring-1 focus:ring-forge-orange"
            required
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-text-secondary">
            Category
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {CATEGORY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCategory(opt.value)}
                className={`border py-2.5 text-sm transition-colors ${
                  category === opt.value
                    ? "border-forge-orange bg-[#1A0A04] text-text-primary"
                    : "border-forge-border bg-forge-elevated text-text-muted hover:bg-forge-subtle"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Type */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-text-secondary">
            Type
          </label>
          <div className="space-y-2">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setHabitType(opt.value)}
                className={`w-full border px-4 py-3 text-left text-sm transition-colors ${
                  habitType === opt.value
                    ? "border-forge-orange bg-[#1A0A04] text-text-primary"
                    : "border-forge-border bg-forge-elevated text-text-muted hover:bg-forge-subtle"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Frequency */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-text-secondary">
            Frequency
          </label>
          <div className="space-y-2">
            {FREQ_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTargetFrequency(opt.value)}
                className={`w-full border px-4 py-3 text-left text-sm transition-colors ${
                  targetFrequency === opt.value
                    ? "border-forge-orange bg-[#1A0A04] text-text-primary"
                    : "border-forge-border bg-forge-elevated text-text-muted hover:bg-forge-subtle"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Custom day selector */}
          {targetFrequency === "custom" && (
            <div className="mt-3 flex flex-wrap gap-2">
              {DAY_LABELS.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={`h-9 w-9 text-xs font-bold transition-colors ${
                    targetDays.includes(i)
                      ? "bg-forge-orange text-forge-base"
                      : "border border-forge-border text-text-muted hover:border-forge-border-strong"
                  }`}
                >
                  {d[0]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="border border-red-800/40 bg-red-950/30 px-4 py-3 text-sm text-red-400">
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={createHabit.isPending}
          className="w-full bg-forge-orange py-3.5 min-h-[52px] text-sm font-bold text-forge-base hover:bg-forge-orange-hover disabled:opacity-50"
        >
          {createHabit.isPending ? "Creating…" : "Create Habit →"}
        </button>
      </form>
    </div>
  );
}
