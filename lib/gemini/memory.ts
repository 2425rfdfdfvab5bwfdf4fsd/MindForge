import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { adminDb } from "@/lib/firebase/admin";

const MEMORY_TYPES = [
  "preference",
  "trigger",
  "victory",
  "fear",
  "identity",
  "pattern",
] as const;

type MemoryType = (typeof MEMORY_TYPES)[number];

interface ExtractedMemory {
  content: string;
  memory_type: MemoryType;
}

const MEMORY_PROMPT = (text: string) =>
  `Extract 0–3 atomic memory facts from this text. Return a JSON array only, no markdown:
[{"content": "...", "memory_type": "preference|trigger|victory|fear|identity|pattern"}]

Rules:
- Only extract genuinely specific, non-obvious facts
- Skip generic statements like "User wants to improve"
- Each fact should be one concrete sentence
- memory_type definitions:
  preference: recurring likes/dislikes/habits
  trigger: specific situations that cause bad behavior
  victory: concrete past wins the user is proud of
  fear: explicit fears or anxieties
  identity: how the user sees themselves or wants to be seen
  pattern: behavioral patterns (recurring actions or avoidance)

Text to analyze:
${text}`;

export async function extractAndStoreMemories(
  userId: string,
  _sessionId: string,
  text: string
): Promise<void> {
  if (!process.env.GEMINI_API_KEY) return;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const flash = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await flash.generateContent({
      contents: [{ role: "user", parts: [{ text: MEMORY_PROMPT(text) }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });

    const raw = result.response.text().trim();
    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed) || parsed.length === 0) return;

    const memories: ExtractedMemory[] = parsed
      .filter(
        (m): m is ExtractedMemory =>
          m &&
          typeof m.content === "string" &&
          m.content.length > 0 &&
          MEMORY_TYPES.includes(m.memory_type)
      )
      .slice(0, 3);

    await Promise.allSettled(
      memories.map((mem) =>
        adminDb.collection("user_memories").add({
          userId,
          content: mem.content,
          memoryType: mem.memory_type,
          createdAt: new Date().toISOString(),
        })
      )
    );
  } catch {
    // Background task — never throw
  }
}
