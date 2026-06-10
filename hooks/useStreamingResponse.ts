"use client";

import { useState, useCallback } from "react";

interface StreamState {
  streamedText: string;
  isStreaming: boolean;
  isComplete: boolean;
  error: string | null;
}

interface UseStreamingResponseReturn extends StreamState {
  startStream: (endpoint: string, body: unknown) => Promise<void>;
  reset: () => void;
}

export function useStreamingResponse(): UseStreamingResponseReturn {
  const [state, setState] = useState<StreamState>({
    streamedText: "",
    isStreaming: false,
    isComplete: false,
    error: null,
  });

  const reset = useCallback(() => {
    setState({ streamedText: "", isStreaming: false, isComplete: false, error: null });
  }, []);

  const startStream = useCallback(async (endpoint: string, body: unknown) => {
    setState({ streamedText: "", isStreaming: true, isComplete: false, error: null });

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const text = await response.text();
        let friendlyError = `Request failed (${response.status})`;
        try {
          const parsed = JSON.parse(text) as { error?: string };
          if (parsed.error === "GEMINI_API_KEY not configured") {
            friendlyError = "GEMINI_API_KEY_MISSING";
          } else if (parsed.error) {
            friendlyError = parsed.error;
          }
        } catch {
          friendlyError = text || friendlyError;
        }
        setState((prev) => ({ ...prev, isStreaming: false, error: friendlyError }));
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        setState((prev) => ({ ...prev, isStreaming: false, error: "No response body" }));
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();

          if (data === "[DONE]") {
            setState((prev) => ({ ...prev, isStreaming: false, isComplete: true }));
            return;
          }

          try {
            const parsed = JSON.parse(data) as { text?: string; error?: string };
            if (parsed.error) {
              setState((prev) => ({ ...prev, isStreaming: false, error: parsed.error ?? "Unknown error" }));
              return;
            }
            if (parsed.text) {
              setState((prev) => ({ ...prev, streamedText: prev.streamedText + parsed.text }));
            }
          } catch {
            // Malformed SSE line — skip
          }
        }
      }

      setState((prev) => ({ ...prev, isStreaming: false, isComplete: true }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isStreaming: false,
        error: err instanceof Error ? err.message : "Stream failed",
      }));
    }
  }, []);

  return { ...state, startStream, reset };
}
