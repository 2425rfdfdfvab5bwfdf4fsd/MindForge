import { embeddingModel } from "./client";

export async function generateEmbedding(text: string): Promise<number[]> {
  async function attempt(): Promise<number[]> {
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  }

  try {
    return await attempt();
  } catch (firstError) {
    try {
      return await attempt();
    } catch (secondError) {
      throw secondError;
    }
  }
}
