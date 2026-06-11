import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const geminiPro = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
export const geminiFlash = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
export const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
