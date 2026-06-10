import "server-only";
import crypto from "crypto";

const BASE = "https://api.lemonsqueezy.com/v1";

function getApiKey(): string {
  const key = process.env.LEMONSQUEEZY_API_KEY;
  if (!key) throw new Error("LEMONSQUEEZY_API_KEY is not configured");
  return key;
}

const PLAN_VARIANT_MAP: Record<string, string | undefined> = {
  pro_monthly: process.env.LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID,
  pro_annual: process.env.LEMONSQUEEZY_PRO_ANNUAL_VARIANT_ID,
  elite_monthly: process.env.LEMONSQUEEZY_ELITE_MONTHLY_VARIANT_ID,
  elite_annual: process.env.LEMONSQUEEZY_ELITE_ANNUAL_VARIANT_ID,
};

export function getVariantIdForPlan(planKey: string): string {
  const id = PLAN_VARIANT_MAP[planKey];
  if (!id) throw new Error(`No variant ID configured for plan: ${planKey}`);
  return id;
}

export function mapVariantToTier(
  variantId: string
): "pro" | "elite" | null {
  const map: Record<string, "pro" | "elite"> = {};
  if (process.env.LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID)
    map[process.env.LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID] = "pro";
  if (process.env.LEMONSQUEEZY_PRO_ANNUAL_VARIANT_ID)
    map[process.env.LEMONSQUEEZY_PRO_ANNUAL_VARIANT_ID] = "pro";
  if (process.env.LEMONSQUEEZY_ELITE_MONTHLY_VARIANT_ID)
    map[process.env.LEMONSQUEEZY_ELITE_MONTHLY_VARIANT_ID] = "elite";
  if (process.env.LEMONSQUEEZY_ELITE_ANNUAL_VARIANT_ID)
    map[process.env.LEMONSQUEEZY_ELITE_ANNUAL_VARIANT_ID] = "elite";
  return map[variantId] ?? null;
}

export async function createCheckoutUrl(
  userId: string,
  email: string,
  variantId: string
): Promise<string> {
  const apiKey = getApiKey();
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  if (!storeId) throw new Error("LEMONSQUEEZY_STORE_ID is not configured");

  const res = await fetch(`${BASE}/checkouts`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email,
            custom: { user_id: userId },
          },
        },
        relationships: {
          store: { data: { type: "stores", id: storeId } },
          variant: { data: { type: "variants", id: variantId } },
        },
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Lemon Squeezy checkout error: ${res.status} ${text}`);
  }

  const json = await res.json();
  return json.data.attributes.url as string;
}

export async function getCustomerPortalUrl(
  customerId: string
): Promise<string | null> {
  const apiKey = getApiKey();
  const res = await fetch(
    `${BASE}/customers/${customerId}?include=urls`,
    {
      headers: {
        Accept: "application/vnd.api+json",
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );
  if (!res.ok) return null;
  const json = await res.json();
  return (
    (json.data?.attributes?.urls?.customer_portal as string) ?? null
  );
}

export function verifyWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) return false;
  try {
    const hmac = crypto
      .createHmac("sha256", secret)
      .update(rawBody, "utf8")
      .digest("hex");
    return crypto.timingSafeEqual(
      Buffer.from(hmac, "hex"),
      Buffer.from(signature, "hex")
    );
  } catch {
    return false;
  }
}
