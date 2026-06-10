import "server-only";
import { generateEmbedding } from "./embeddings";
import {
  FORGE_COACH_BASE_SYSTEM_PROMPT,
  FORGE_COACH_FIRM_PROMPT,
  CHECKIN_DEBRIEF_SYSTEM_PROMPT,
  ONBOARDING_MIRROR_SYSTEM_PROMPT,
  WHY_EXCAVATION_SYSTEM_PROMPT,
  FORTY_PERCENT_RULE_SYSTEM_PROMPT,
} from "./prompts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

interface Memory {
  content: string;
  memory_type: string;
  similarity?: number;
}

interface CookieJarEntry {
  title: string;
  description: string;
  similarity?: number;
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
// Semantic retrieval helpers
// ---------------------------------------------------------------------------

async function fetchSemanticMemories(
  supabase: SupabaseClient,
  userId: string,
  embedding: number[]
): Promise<Memory[]> {
  try {
    const { data } = await supabase.rpc("match_memories", {
      query_embedding: embedding,
      match_user_id: userId,
      match_count: 5,
    });
    return (data ?? []) as Memory[];
  } catch {
    // Fallback: return most recent memories without semantic ranking
    const { data } = await supabase
      .from("user_memories")
      .select("content, memory_type")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);
    return (data ?? []) as Memory[];
  }
}

async function fetchSemanticCookieJar(
  supabase: SupabaseClient,
  userId: string,
  embedding: number[]
): Promise<CookieJarEntry[]> {
  try {
    const { data } = await supabase.rpc("match_cookie_jar", {
      query_embedding: embedding,
      match_user_id: userId,
      match_count: 3,
    });
    return (data ?? []) as CookieJarEntry[];
  } catch {
    // Fallback: return most recent entries
    const { data } = await supabase
      .from("cookie_jar_entries")
      .select("title, description")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(3);
    return (data ?? []) as CookieJarEntry[];
  }
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
  return entries
    .map((e) => `• ${e.title}: ${e.description}`)
    .join("\n");
}

function formatHabits(habits: HabitWithStreak[]): string {
  if (!habits.length) return "No active habits.";
  return habits
    .map((h) => `• ${h.name} (${h.current_streak}d streak)`)
    .join("\n");
}

// ---------------------------------------------------------------------------
// Main export: enriched system prompt with RAG context
// ---------------------------------------------------------------------------

export async function buildCoachSystemPrompt(
  supabase: SupabaseClient,
  userId: string,
  currentMessage: string,
  sessionType: SessionType
): Promise<string> {
  // Run all data fetches in parallel — generate embedding first as it gates RAG
  let embedding: number[] = [];

  try {
    embedding = await generateEmbedding(currentMessage);
  } catch {
    // Embedding unavailable — RAG will fall back to recency
  }

  const [profileResult, habitsResult, streaksResult, memories, cookieJar] =
    await Promise.all([
      supabase
        .from("users")
        .select(
          "why_statement, identity_declaration, level, forge_score, coach_intensity"
        )
        .eq("id", userId)
        .single(),

      supabase
        .from("habits")
        .select("id, name")
        .eq("user_id", userId)
        .eq("is_active", true),

      supabase
        .from("habit_streaks")
        .select("habit_id, current_streak")
        .eq("user_id", userId),

      fetchSemanticMemories(supabase, userId, embedding),
      fetchSemanticCookieJar(supabase, userId, embedding),
    ]);

  const profile = profileResult.data;
  const habits = (habitsResult.data ?? []) as Array<{ id: string; name: string }>;
  const streaks = (streaksResult.data ?? []) as Array<{
    habit_id: string;
    current_streak: number;
  }>;

  // Build top-5 habits by streak
  const streakMap = new Map(streaks.map((s) => [s.habit_id, s.current_streak]));
  const habitsWithStreaks: HabitWithStreak[] = habits
    .map((h) => ({ name: h.name, current_streak: streakMap.get(h.id) ?? 0 }))
    .sort((a, b) => b.current_streak - a.current_streak)
    .slice(0, 5);

  const intensity = profile?.coach_intensity ?? "hard";
  const basePrompt =
    intensity === "firm" ? FORGE_COACH_FIRM_PROMPT : FORGE_COACH_BASE_SYSTEM_PROMPT;

  const userCtxBlock = `
--- USER CONTEXT ---
Why Statement: ${profile?.why_statement ?? "Not set"}
Identity Declaration: ${profile?.identity_declaration ?? "Not set"}
Forge Score: ${profile?.forge_score ?? 0} | Level: ${profile?.level ?? 1}

Active Habits & Streaks:
${formatHabits(habitsWithStreaks)}

Cookie Jar (Top Victories):
${formatCookieJar(cookieJar)}

Relevant Memories:
${formatMemories(memories)}
--- END CONTEXT ---`;

  // Compose final prompt per session type
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
          profile?.why_statement ?? "Not set"
        )
          .replace(
            "{IDENTITY_DECLARATION}",
            profile?.identity_declaration ?? "Not set"
          )
          .replace("{FORGE_SCORE}", String(profile?.forge_score ?? 0))
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
        .replace("{WHY_STATEMENT}", profile?.why_statement ?? "Not set")
        .replace("{FORGE_SCORE}", String(profile?.forge_score ?? 0));

    case "direct_chat":
    default:
      return basePrompt + "\n\n" + userCtxBlock;
  }
}
