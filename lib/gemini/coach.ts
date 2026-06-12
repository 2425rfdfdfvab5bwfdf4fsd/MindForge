import "server-only";
import { adminDb } from "@/lib/firebase/admin";
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

async function fetchRecentMemories(userId: string): Promise<Memory[]> {
  const snap = await adminDb
    .collection("user_memories")
    .where("userId", "==", userId)
    .get();
  return snap.docs
    .map((d) => ({
      content: d.data().content as string,
      memory_type: d.data().memoryType as string,
      createdAt: (d.data().createdAt as string) ?? "",
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)
    .map(({ content, memory_type }) => ({ content, memory_type }));
}

async function fetchRecentCookieJar(userId: string): Promise<CookieJarEntry[]> {
  const snap = await adminDb
    .collection("cookie_jar_entries")
    .where("userId", "==", userId)
    .get();
  return snap.docs
    .map((d) => ({
      title: d.data().title as string,
      description: d.data().description as string,
      createdAt: (d.data().createdAt as string) ?? "",
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3)
    .map(({ title, description }) => ({ title, description }));
}

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

export async function buildCoachSystemPrompt(
  userId: string,
  currentMessage: string,
  sessionType: SessionType
): Promise<string> {
  const [profileSnap, habitsSnap, streaksSnap, memories, cookieJar] =
    await Promise.all([
      adminDb.collection("users").doc(userId).get(),
      adminDb
        .collection("habits")
        .where("userId", "==", userId)
        .where("isActive", "==", true)
        .get(),
      adminDb
        .collection("habit_streaks")
        .where("userId", "==", userId)
        .get(),
      fetchRecentMemories(userId),
      fetchRecentCookieJar(userId),
    ]);

  const profile = profileSnap.data() ?? null;
  const habitRows = habitsSnap.docs.map((d) => ({ id: d.id, name: d.data().name as string }));
  const streakMap = new Map(
    streaksSnap.docs.map((d) => [d.data().habitId as string, d.data().currentStreak as number])
  );
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
