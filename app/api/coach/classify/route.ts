import { createClient } from "@/lib/supabase/server";
import { geminiFlash } from "@/lib/gemini/client";

type MoodSignal = "excusing" | "deflecting" | "owning" | "crushing";

interface ClassifyResponse {
  honesty_score: number;
  mood_signal: MoodSignal;
}

const CLASSIFY_PROMPT = (text: string) => `Analyze this daily check-in text and return JSON with exactly these two fields:
1. honesty_score: integer 1–10 (1=entirely avoidant/deflecting, 10=radically self-aware and accountable)
2. mood_signal: one of exactly: 'excusing' | 'deflecting' | 'owning' | 'crushing'

Definitions:
- excusing: user is rationalizing failures, blaming circumstances
- deflecting: user is changing the subject, avoiding the real issue
- owning: user is acknowledging their actions honestly, neither great nor bad
- crushing: user is genuinely thriving, high accountability + positive results

Text: ${text}

Return ONLY valid JSON, no other text.`;

export async function POST(request: Request) {
  // Authenticate
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse body
  let body: { checkin_id: string; text: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { text } = body;
  if (!text?.trim()) {
    return Response.json({ error: "text is required" }, { status: 400 });
  }

  try {
    const result = await geminiFlash.generateContent({
      contents: [{ role: "user", parts: [{ text: CLASSIFY_PROMPT(text) }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const raw = result.response.text();
    const parsed: ClassifyResponse = JSON.parse(raw);

    // Validate shape
    const validMoods: MoodSignal[] = ["excusing", "deflecting", "owning", "crushing"];
    if (
      typeof parsed.honesty_score !== "number" ||
      parsed.honesty_score < 1 ||
      parsed.honesty_score > 10 ||
      !validMoods.includes(parsed.mood_signal)
    ) {
      return Response.json({ error: "Invalid classification response" }, { status: 502 });
    }

    return Response.json({
      honesty_score: Math.round(parsed.honesty_score),
      mood_signal: parsed.mood_signal,
    });
  } catch {
    return Response.json({ error: "Classification unavailable" }, { status: 503 });
  }
}
