"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { api } from "@/lib/trpc/client";
import { HabitCard } from "@/components/forge/HabitCard";

function getLocalDate(timezone: string): string {
  try {
    return new Date().toLocaleDateString("en-CA", { timeZone: timezone });
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export default function HabitsPage() {
  const [localDate, setLocalDate] = useState(() => getLocalDate("UTC"));

  const { data: profile } = api.user.getProfile.useQuery(undefined, {
    retry: false,
  });

  useEffect(() => {
    if (profile?.timezone) {
      setLocalDate(getLocalDate(profile.timezone));
    }
  }, [profile?.timezone]);

  const {
    data: habits,
    isLoading,
    refetch,
  } = api.habits.list.useQuery(
    { localDate },
    { retry: false }
  );

  const isFree = !profile || profile.tier === "free";
  const atLimit = isFree && (habits?.length ?? 0) >= 3;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-10">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-y-3">
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-primary">
            Habits
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {localDate
              ? new Date(localDate + "T12:00:00").toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })
              : ""}
          </p>
        </div>

        <Link
          href="/habits/new"
          className={`flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-bold text-forge-base transition-opacity ${
            atLimit
              ? "pointer-events-none bg-forge-orange opacity-40"
              : "bg-forge-orange hover:bg-forge-orange-hover"
          }`}
        >
          <Plus size={16} />
          New Habit
        </Link>
      </div>

      {/* Free tier upgrade banner */}
      {atLimit && (
        <div className="mb-6 border border-forge-orange/40 bg-[#1A0A04] px-5 py-4">
          <p className="text-sm font-medium text-text-primary">
            Free plan limit reached — 3 habits maximum.
          </p>
          <p className="mt-1 text-sm text-text-muted">
            Upgrade to Pro to track unlimited habits and unlock the full forge.
          </p>
          <button className="mt-3 border border-forge-orange px-4 py-1.5 text-xs font-bold text-forge-orange hover:bg-forge-orange hover:text-forge-base transition-colors">
            Upgrade to Pro →
          </button>
        </div>
      )}

      {/* Habits list */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse bg-forge-elevated"
              style={{ borderLeft: "3px solid #2A2927" }}
            />
          ))}
        </div>
      )}

      {!isLoading && (!habits || habits.length === 0) && (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <p className="text-2xl">🔥</p>
          <p className="text-base font-medium text-text-secondary">
            No habits yet. Build your first one.
          </p>
          <Link
            href="/habits/new"
            className="bg-forge-orange px-6 py-3 text-sm font-bold text-forge-base hover:bg-forge-orange-hover"
          >
            Create First Habit
          </Link>
        </div>
      )}

      {!isLoading && habits && habits.length > 0 && (
        <div className="space-y-3">
          {habits.map((h) => (
            <HabitCard
              key={h.id}
              habit={h as typeof h & { today_status: "pending" | "completed" | "missed" }}
              localDate={localDate}
              onUpdate={() => refetch()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
