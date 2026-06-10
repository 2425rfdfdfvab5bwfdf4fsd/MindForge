import { createClient } from "@/lib/supabase/server";
import { extractAndStoreMemories } from "@/lib/gemini/memory";

interface MessagePart { text: string }
interface SessionMessage {
  role: "user" | "model";
  parts: MessagePart[];
  timestamp: string;
}

// POST /api/sessions/coach
// Body: { action: "create" | "append" | "close", sessionId?, message? }
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

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
    const { data, error } = await supabase
      .from("coaching_sessions")
      .insert({
        user_id: user.id,
        session_type: "direct_chat",
        messages: message ? [message] : [],
      })
      .select("id")
      .single();

    if (error) return new Response(error.message, { status: 500 });
    return Response.json({ sessionId: data.id });
  }

  if (action === "append") {
    if (!sessionId || !message) {
      return new Response("sessionId and message required", { status: 400 });
    }

    // Verify ownership
    const { data: session } = await supabase
      .from("coaching_sessions")
      .select("messages, user_id")
      .eq("id", sessionId)
      .single();

    if (!session || session.user_id !== user.id) {
      return new Response("Not found", { status: 404 });
    }

    const updated = [...(session.messages ?? []), message];
    const { error } = await supabase
      .from("coaching_sessions")
      .update({ messages: updated })
      .eq("id", sessionId);

    if (error) return new Response(error.message, { status: 500 });
    return new Response(null, { status: 204 });
  }

  if (action === "close") {
    if (!sessionId) return new Response("sessionId required", { status: 400 });

    // Trigger memory extraction in background if text provided
    if (fullText?.trim()) {
      extractAndStoreMemories(supabase, user.id, sessionId, fullText).catch(() => {});
    }
    return new Response(null, { status: 202 });
  }

  return new Response("Unknown action", { status: 400 });
}

// GET /api/sessions/coach?limit=50
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

  const { data, error } = await supabase
    .from("coaching_sessions")
    .select("id, messages, created_at")
    .eq("user_id", user.id)
    .eq("session_type", "direct_chat")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) return new Response(error.message, { status: 500 });

  const session = data?.[0];
  const messages = (session?.messages ?? []) as SessionMessage[];

  return Response.json({
    sessionId: session?.id ?? null,
    messages: messages.slice(-limit),
  });
}
