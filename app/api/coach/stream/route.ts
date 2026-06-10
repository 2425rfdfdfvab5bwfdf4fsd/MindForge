import { getSessionFromRequest } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import { geminiPro } from "@/lib/gemini/client";
import {
  FORGE_COACH_BASE_SYSTEM_PROMPT,
  FORGE_COACH_FIRM_PROMPT,
  ONBOARDING_MIRROR_SYSTEM_PROMPT,
  WHY_EXCAVATION_SYSTEM_PROMPT,
} from "@/lib/gemini/prompts";
import { buildCoachSystemPrompt } from "@/lib/gemini/coach";

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

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 60 * 1000;

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

function buildFallbackPrompt(
  sessionType: SessionType,
  coachIntensity: string,
  _context: StreamContext
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
    default:
      return basePrompt;
  }
}

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  if (!checkRateLimit(session.id)) {
    return new Response("Too many requests", { status: 429 });
  }

  const userDoc = await adminDb.collection("users").doc(session.id).get();
  const profile = userDoc.data() ?? null;

  let body: {
    session_type: SessionType;
    messages: Message[];
    context: StreamContext;
  };
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const { session_type, messages, context } = body;

  if (session_type === "direct_chat" || session_type === "daily_checkin") {
    if ((profile?.tier ?? "free") === "free") {
      return new Response("Forbidden: Pro or Elite tier required", { status: 403 });
    }
  }

  if (!messages || messages.length === 0) {
    return new Response("No messages provided", { status: 400 });
  }

  const lastMessage = messages[messages.length - 1];
  const lastUserText = lastMessage.parts.map((p) => p.text).join("");
  const history = messages.slice(0, -1);

  let systemPrompt: string;
  const ragTypes: SessionType[] = [
    "daily_checkin",
    "direct_chat",
    "forty_percent_rule",
  ];

  if (ragTypes.includes(session_type) && process.env.GEMINI_API_KEY) {
    try {
      systemPrompt = await buildCoachSystemPrompt(
        session.id,
        context?.trigger_context ?? lastUserText,
        session_type
      );
    } catch {
      systemPrompt = buildFallbackPrompt(
        session_type,
        profile?.coachIntensity ?? "hard",
        context ?? {}
      );
    }
  } else {
    systemPrompt = buildFallbackPrompt(
      session_type,
      profile?.coachIntensity ?? "hard",
      {
        why_statement:
          context?.why_statement ?? profile?.whyStatement ?? undefined,
        identity_declaration:
          context?.identity_declaration ??
          profile?.identityDeclaration ??
          undefined,
        forge_score: context?.forge_score ?? profile?.forgeScore ?? 0,
        memories: context?.memories,
        trigger_context: context?.trigger_context,
        cookie_jar_entry: context?.cookie_jar_entry,
      }
    );
  }

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
          history: history.map((m) => ({ role: m.role, parts: m.parts })),
          systemInstruction: systemPrompt,
        });
        const result = await chat.sendMessageStream(lastUserText);
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            controller.enqueue(encode(`data: ${JSON.stringify({ text })}\n\n`));
          }
        }
        controller.enqueue(encode("data: [DONE]\n\n"));
      } catch {
        controller.enqueue(
          encode(
            `data: ${JSON.stringify({ error: "Coach unavailable" })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
