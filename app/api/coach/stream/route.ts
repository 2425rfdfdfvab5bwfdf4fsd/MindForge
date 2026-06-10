import { createClient } from "@/lib/supabase/server";
import { geminiPro } from "@/lib/gemini/client";
import {
  FORGE_COACH_BASE_SYSTEM_PROMPT,
  FORGE_COACH_FIRM_PROMPT,
  ONBOARDING_MIRROR_SYSTEM_PROMPT,
  WHY_EXCAVATION_SYSTEM_PROMPT,
  CHECKIN_DEBRIEF_SYSTEM_PROMPT,
  FORTY_PERCENT_RULE_SYSTEM_PROMPT,
} from "@/lib/gemini/prompts";

type SessionType =
  | "onboarding_mirror"
  | "why_excavation"
  | "daily_checkin"
  | "forty_percent_rule"
  | "direct_chat";

interface MessagePart {
  text: string;
}
interface Message {
  role: "user" | "model";
  parts: MessagePart[];
}
interface StreamContext {
  why_statement?: string;
  identity_declaration?: string;
  forge_score?: number;
  memories?: string;
  trigger_context?: string;
  cookie_jar_entry?: string;
}

// In-memory rate limiter: userId → { count, resetAt }
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) return false;

  entry.count += 1;
  return true;
}

function buildSystemPrompt(
  sessionType: SessionType,
  coachIntensity: string,
  context: StreamContext
): string {
  const basePrompt =
    coachIntensity === "firm"
      ? FORGE_COACH_FIRM_PROMPT
      : FORGE_COACH_BASE_SYSTEM_PROMPT;

  switch (sessionType) {
    case "onboarding_mirror":
      return coachIntensity === "firm"
        ? ONBOARDING_MIRROR_SYSTEM_PROMPT.replace(
            FORGE_COACH_BASE_SYSTEM_PROMPT,
            FORGE_COACH_FIRM_PROMPT
          )
        : ONBOARDING_MIRROR_SYSTEM_PROMPT;

    case "why_excavation":
      return coachIntensity === "firm"
        ? WHY_EXCAVATION_SYSTEM_PROMPT.replace(
            FORGE_COACH_BASE_SYSTEM_PROMPT,
            FORGE_COACH_FIRM_PROMPT
          )
        : WHY_EXCAVATION_SYSTEM_PROMPT;

    case "daily_checkin":
      return CHECKIN_DEBRIEF_SYSTEM_PROMPT.replace(
        "{WHY_STATEMENT}",
        context.why_statement ?? "Not set"
      )
        .replace("{IDENTITY_DECLARATION}", context.identity_declaration ?? "Not set")
        .replace("{FORGE_SCORE}", String(context.forge_score ?? 0))
        .replace("{MEMORIES}", context.memories ?? "No memories recorded yet.");

    case "forty_percent_rule":
      return FORTY_PERCENT_RULE_SYSTEM_PROMPT.replace(
        "{TRIGGER_CONTEXT}",
        context.trigger_context ?? "User requested intervention"
      )
        .replace("{COOKIE_JAR_ENTRY}", context.cookie_jar_entry ?? "No past victories recorded yet.")
        .replace("{WHY_STATEMENT}", context.why_statement ?? "Not set")
        .replace("{FORGE_SCORE}", String(context.forge_score ?? 0));

    case "direct_chat":
      return basePrompt;

    default:
      return basePrompt;
  }
}

export async function POST(request: Request) {
  // Authenticate
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Rate limit
  if (!checkRateLimit(user.id)) {
    return new Response("Too many requests", { status: 429 });
  }

  // Fetch user profile for tier + coach intensity
  const { data: profile } = await supabase
    .from("users")
    .select("tier, coach_intensity, why_statement, identity_declaration, forge_score")
    .eq("id", user.id)
    .single();

  // Parse body
  let body: { session_type: SessionType; messages: Message[]; context: StreamContext };
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const { session_type, messages, context } = body;

  // Tier gate for direct_chat and daily_checkin
  if (session_type === "direct_chat" || session_type === "daily_checkin") {
    const tier = profile?.tier ?? "free";
    if (tier === "free") {
      return new Response("Forbidden: Pro or Elite tier required", { status: 403 });
    }
  }

  if (!messages || messages.length === 0) {
    return new Response("No messages provided", { status: 400 });
  }

  const systemPrompt = buildSystemPrompt(
    session_type,
    profile?.coach_intensity ?? "hard",
    {
      why_statement: context?.why_statement ?? profile?.why_statement ?? undefined,
      identity_declaration: context?.identity_declaration ?? profile?.identity_declaration ?? undefined,
      forge_score: context?.forge_score ?? profile?.forge_score ?? 0,
      memories: context?.memories,
      trigger_context: context?.trigger_context,
      cookie_jar_entry: context?.cookie_jar_entry,
    }
  );

  const history = messages.slice(0, -1);
  const lastMessage = messages[messages.length - 1];

  const SSE_HEADERS = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  };

  const stream = new ReadableStream({
    async start(controller) {
      const encode = (s: string) => new TextEncoder().encode(s);

      try {
        const chat = geminiPro.startChat({
          history: history.map((m) => ({
            role: m.role,
            parts: m.parts,
          })),
          systemInstruction: systemPrompt,
        });

        const result = await chat.sendMessageStream(
          lastMessage.parts.map((p) => p.text).join("")
        );

        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            controller.enqueue(
              encode(`data: ${JSON.stringify({ text })}\n\n`)
            );
          }
        }

        controller.enqueue(encode("data: [DONE]\n\n"));
      } catch {
        controller.enqueue(
          encode(`data: ${JSON.stringify({ error: "Coach unavailable" })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
