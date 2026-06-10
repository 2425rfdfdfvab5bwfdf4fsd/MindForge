import "server-only";
import { db } from "@/server/db";
import { users, habits, habitStreaks, userMemories, cookieJarEntries } from "@/shared/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  FORGE_COACH_BASE_SYSTEM_PROMPT,
  FORGE_COACH_FIRM_PROMPT,
  CHECKIN_DEBRIEF_SYSTEM_PROMPT,
  ONBOARDING_MIRROR_SYSTEM_PROMPT,
  WHY_EXCAVATION_SYSTEM_PROMPT,
  FORTY_PERCENT_RULE_SYSTEM_PROMPT,
} from "./prompts";

interface Memory {
  content: string;
  memory_type: string;
}

interface CookieJarEntry {
  title: string;
  description: string;
}

interface HabitWithStreak {
  name: string;
  current_streak: number;
}

type SessionType =
  | "onboarding_mirror"
  | "why_excavation"
  | "daily_checkin"
  | "forty_percent_rule"
  | "direct_chat";

// ---------------------------------------------------------------------------
// Data helpers (recency-based — pgvector not available on Replit)
// ---------------------------------------------------------------------------

async function fetchRecentMemories(userId: string): Promise<Memory[]> {
  const rows = await db
    .select({ content: userMemories.content, memoryType: userMemories.memoryType })
    .from(userMemories)
    .where(eq(userMemories.userId, userId))
    .orderBy(desc(userMemories.createdAt))
    .limit(5);
  return rows.map((r) => ({ content: r.content, memory_type: r.memoryType }));
}

async function fetchRecentCookieJar(userId: string): Promise<CookieJarEntry[]> {
  return db
    .select({ title: cookieJarEntries.title, description: cookieJarEntries.description })
    .from(cookieJarEntries)
    .where(eq(cookieJarEntries.userId, userId))
    .orderBy(desc(cookieJarEntries.createdAt))
    .limit(3);
}

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

function formatMemories(memories: Memory[]): string {
  if (!memories.length) return "No memories recorded yet.";
  return memories
    .map((m) => `[${m.memory_type.toUpperCase()}] ${m.content}`)
    .join("\n");
}

function formatCookieJar(entries: CookieJarEntry[]): string {
  if (!entries.length) return "No past victories recorded yet.";
  return entries.map((e) => `• ${e.title}: ${e.description}`).join("\n");
}

function formatHabits(habitList: HabitWithStreak[]): string {
  if (!habitList.length) return "No active habits.";
  return habitList
    .map((h) => `• ${h.name} (${h.current_streak}d streak)`)
    .join("\n");
}

// ---------------------------------------------------------------------------
// Main export: enriched system prompt with context
// ---------------------------------------------------------------------------

export async function buildCoachSystemPrompt(
  userId: string,
  currentMessage: string,
  sessionType: SessionType
): Promise<string> {
  const [profileRows, habitRows, streakRows, memories, cookieJar] =
    await Promise.all([
      db
        .select({
          whyStatement: users.whyStatement,
          identityDeclaration: users.identityDeclaration,
          level: users.level,
          forgeScore: users.forgeScore,
          coachIntensity: users.coachIntensity,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1),

      db
        .select({ id: habits.id, name: habits.name })
        .from(habits)
        .where(and(eq(habits.userId, userId), eq(habits.isActive, true))),

      db
        .select({ habitId: habitStreaks.habitId, currentStreak: habitStreaks.currentStreak })
        .from(habitStreaks)
        .where(eq(habitStreaks.userId, userId)),

      fetchRecentMemories(userId),
      fetchRecentCookieJar(userId),
    ]);

  const profile = profileRows[0] ?? null;
  const streakMap = new Map(streakRows.map((s) => [s.habitId, s.currentStreak]));
  const habitsWithStreaks: HabitWithStreak[] = habitRows
    .map((h) => ({ name: h.name, current_streak: streakMap.get(h.id) ?? 0 }))
    .sort((a, b) => b.current_streak - a.current_streak)
    .slice(0, 5);

  const intensity = profile?.coachIntensity ?? "hard";
  const basePrompt =
    intensity === "firm" ? FORGE_COACH_FIRM_PROMPT : FORGE_COACH_BASE_SYSTEM_PROMPT;

  const userCtxBlock = `
--- USER CONTEXT ---
Why Statement: ${profile?.whyStatement ?? "Not set"}
Identity Declaration: ${profile?.identityDeclaration ?? "Not set"}
Forge Score: ${profile?.forgeScore ?? 0} | Level: ${profile?.level ?? 1}

Active Habits & Streaks:
${formatHabits(habitsWithStreaks)}

Cookie Jar (Top Victories):
${formatCookieJar(cookieJar)}

Relevant Memories:
${formatMemories(memories)}
--- END CONTEXT ---`;

  switch (sessionType) {
    case "onboarding_mirror":
      return intensity === "firm"
        ? ONBOARDING_MIRROR_SYSTEM_PROMPT.replace(
            FORGE_COACH_BASE_SYSTEM_PROMPT,
            FORGE_COACH_FIRM_PROMPT
          )
        : ONBOARDING_MIRROR_SYSTEM_PROMPT;

    case "why_excavation":
      return intensity === "firm"
        ? WHY_EXCAVATION_SYSTEM_PROMPT.replace(
            FORGE_COACH_BASE_SYSTEM_PROMPT,
            FORGE_COACH_FIRM_PROMPT
          )
        : WHY_EXCAVATION_SYSTEM_PROMPT;

    case "daily_checkin":
      return (
        CHECKIN_DEBRIEF_SYSTEM_PROMPT.replace(
          "{WHY_STATEMENT}",
          profile?.whyStatement ?? "Not set"
        )
          .replace("{IDENTITY_DECLARATION}", profile?.identityDeclaration ?? "Not set")
          .replace("{FORGE_SCORE}", String(profile?.forgeScore ?? 0))
          .replace("{MEMORIES}", formatMemories(memories)) +
        "\n\n" +
        `User's active habits for context:\n${formatHabits(habitsWithStreaks)}`
      );

    case "forty_percent_rule":
      return FORTY_PERCENT_RULE_SYSTEM_PROMPT.replace(
        "{TRIGGER_CONTEXT}",
        currentMessage
      )
        .replace(
          "{COOKIE_JAR_ENTRY}",
          cookieJar[0]
            ? `${cookieJar[0].title}: ${cookieJar[0].description}`
            : "No past victories recorded yet."
        )
        .replace("{WHY_STATEMENT}", profile?.whyStatement ?? "Not set")
        .replace("{FORGE_SCORE}", String(profile?.forgeScore ?? 0));

    case "direct_chat":
    default:
      return basePrompt + "\n\n" + userCtxBlock;
  }
}
