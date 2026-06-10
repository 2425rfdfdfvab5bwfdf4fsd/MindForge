import { getSessionFromRequest } from "@/lib/auth";
import { db } from "@/server/db";
import { coachingSessions } from "@/shared/schema";
import { eq, desc } from "drizzle-orm";
import { extractAndStoreMemories } from "@/lib/gemini/memory";

interface MessagePart {
  text: string;
}
interface SessionMessage {
  role: "user" | "model";
  parts: MessagePart[];
  timestamp: string;
}

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  let body: {
    action: "create" | "append" | "close";
    sessionId?: string;
    message?: SessionMessage;
    fullText?: string;
  };
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { action, sessionId, message, fullText } = body;

  if (action === "create") {
    const [row] = await db
      .insert(coachingSessions)
      .values({
        userId: session.id,
        sessionType: "direct_chat",
        messages: message ? [message] : [],
      })
      .returning({ id: coachingSessions.id });
    return Response.json({ sessionId: row.id });
  }

  if (action === "append") {
    if (!sessionId || !message) {
      return new Response("sessionId and message required", { status: 400 });
    }
    const [existing] = await db
      .select({ messages: coachingSessions.messages, userId: coachingSessions.userId })
      .from(coachingSessions)
      .where(eq(coachingSessions.id, sessionId))
      .limit(1);

    if (!existing || existing.userId !== session.id) {
      return new Response("Not found", { status: 404 });
    }

    const messages = [...((existing.messages as SessionMessage[]) ?? []), message];
    await db
      .update(coachingSessions)
      .set({ messages })
      .where(eq(coachingSessions.id, sessionId));
    return new Response(null, { status: 204 });
  }

  if (action === "close") {
    if (!sessionId) return new Response("sessionId required", { status: 400 });
    if (fullText?.trim()) {
      extractAndStoreMemories(session.id, sessionId, fullText).catch(() => {});
    }
    return new Response(null, { status: 202 });
  }

  return new Response("Unknown action", { status: 400 });
}

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

  const rows = await db
    .select({ id: coachingSessions.id, messages: coachingSessions.messages, createdAt: coachingSessions.createdAt })
    .from(coachingSessions)
    .where(eq(coachingSessions.userId, session.id))
    .orderBy(desc(coachingSessions.createdAt))
    .limit(1);

  const row = rows[0];
  const messages = (row?.messages as SessionMessage[]) ?? [];

  return Response.json({
    sessionId: row?.id ?? null,
    messages: messages.slice(-limit),
  });
}
