import { PostHog } from "posthog-node";

let client: PostHog | null = null;

function getClient(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;
  if (!client) {
    client = new PostHog(key, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return client;
}

export function trackServerEvent(
  userId: string,
  event: string,
  properties?: Record<string, unknown>
) {
  try {
    const ph = getClient();
    if (!ph) return;
    ph.capture({ distinctId: userId, event, properties });
  } catch {
    // never throw from analytics
  }
}
