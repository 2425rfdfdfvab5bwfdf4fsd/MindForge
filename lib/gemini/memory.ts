import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateEmbedding } from "./embeddings";

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

Good examples:
- "User wakes at 6am consistently during the week"
- "User struggles with night snacking after 10pm when stressed"
- "User fears disappointing their family if they fail"

Text to analyze:
${text}`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function extractAndStoreMemories(
  supabase: any,
  userId: string,
  sessionId: string,
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

    // Generate embeddings and insert in parallel
    await Promise.allSettled(
      memories.map(async (mem) => {
        let embedding: number[] = [];
        try {
          embedding = await generateEmbedding(mem.content);
        } catch {
          // Embedding failure shouldn't block storage
        }

        await supabase.from("user_memories").insert({
          user_id: userId,
          source_session_id: sessionId,
          content: mem.content,
          memory_type: mem.memory_type,
          embedding: embedding.length > 0 ? embedding : null,
        });
      })
    );
  } catch {
    // Memory extraction is a background task — never throw
  }
}
