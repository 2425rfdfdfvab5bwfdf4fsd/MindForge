import { getSessionFromRequest } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
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
    const ref = await adminDb.collection("coaching_sessions").add({
      userId: session.id,
      sessionType: "direct_chat",
      messages: message ? [message] : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return Response.json({ sessionId: ref.id });
  }

  if (action === "append") {
    if (!sessionId || !message) {
      return new Response("sessionId and message required", { status: 400 });
    }
    const docRef = adminDb.collection("coaching_sessions").doc(sessionId);
    const existing = await docRef.get();

    if (!existing.exists || existing.data()?.userId !== session.id) {
      return new Response("Not found", { status: 404 });
    }

    const messages = [...((existing.data()?.messages as SessionMessage[]) ?? []), message];
    await docRef.update({ messages, updatedAt: new Date().toISOString() });
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

  const snap = await adminDb
    .collection("coaching_sessions")
    .where("userId", "==", session.id)
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  const row = snap.docs[0];
  const messages = (row?.data()?.messages as SessionMessage[]) ?? [];

  return Response.json({
    sessionId: row?.id ?? null,
    messages: messages.slice(-limit),
  });
}
