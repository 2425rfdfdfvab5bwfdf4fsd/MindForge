import { createClient } from "@/lib/supabase/server";
import { extractAndStoreMemories } from "@/lib/gemini/memory";

export async function POST(request: Request) {
  // Authenticate
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

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

  // Fire-and-forget — respond immediately, extraction runs async
  extractAndStoreMemories(supabase, user.id, sessionId, text).catch(() => {});

  return new Response(null, { status: 202 });
}
