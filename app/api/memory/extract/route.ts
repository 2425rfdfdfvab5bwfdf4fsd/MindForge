import { getSessionFromRequest } from "@/lib/auth";
import { extractAndStoreMemories } from "@/lib/gemini/memory";

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  let body: { sessionId: string; text: string };
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { sessionId, text } = body;
  if (!sessionId || !text?.trim()) {
    return new Response("sessionId and text are required", { status: 400 });
  }

  extractAndStoreMemories(session.id, sessionId, text).catch(() => {});
  return new Response(null, { status: 202 });
}
