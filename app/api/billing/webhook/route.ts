import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { subscriptions, users } from "@/shared/schema";
import { eq } from "drizzle-orm";
import { verifyWebhookSignature, mapVariantToTier } from "@/lib/lemonsqueezy";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature") ?? "";

  if (!verifyWebhookSignature(rawBody, signature)) {
    console.error("LemonSqueezy webhook: invalid HMAC signature");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const meta = payload.meta as Record<string, unknown> | undefined;
  const eventName = meta?.event_name as string | undefined;
  const customData = meta?.custom_data as Record<string, unknown> | undefined;
  const dataObj = payload.data as Record<string, unknown> | undefined;
  const attrs = dataObj?.attributes as Record<string, unknown> | undefined;

  if (!eventName || !attrs) {
    return NextResponse.json({ received: true });
  }

  const userId = (customData?.user_id as string) ?? null;
  const lsSubscriptionId = dataObj?.id as string | undefined;
  const lsCustomerId = String(attrs.customer_id ?? "");
  const variantId = String(attrs.variant_id ?? "");

  const rawStatus = attrs.status as string | undefined;
  const statusMap: Record<string, "active" | "cancelled" | "past_due" | "expired"> = {
    active: "active",
    cancelled: "cancelled",
    past_due: "past_due",
    expired: "expired",
    unpaid: "past_due",
  };

  const currentPeriodEnd = attrs.renews_at
    ? new Date(attrs.renews_at as string)
    : attrs.ends_at
    ? new Date(attrs.ends_at as string)
    : null;

  try {
    switch (eventName) {
      case "subscription_created": {
        if (!userId || !lsSubscriptionId) break;
        const tier = mapVariantToTier(variantId) ?? "pro";

        await db
          .insert(subscriptions)
          .values({
            userId,
            lemonsqueezyCustomerId: lsCustomerId || null,
            lemonsqueezySubscriptionId: lsSubscriptionId,
            tier,
            status: "active",
            currentPeriodEnd,
          })
          .onConflictDoUpdate({
            target: subscriptions.lemonsqueezySubscriptionId,
            set: { status: "active", tier, currentPeriodEnd, updatedAt: new Date() },
          });

        await db
          .update(users)
          .set({ tier, updatedAt: new Date() })
          .where(eq(users.id, userId));
        break;
      }

      case "subscription_updated": {
        if (!lsSubscriptionId) break;
        const status = statusMap[rawStatus ?? ""] ?? "active";
        await db
          .update(subscriptions)
          .set({ status, currentPeriodEnd, updatedAt: new Date() })
          .where(eq(subscriptions.lemonsqueezySubscriptionId, lsSubscriptionId));
        break;
      }

      case "subscription_cancelled": {
        if (!lsSubscriptionId) break;
        await db
          .update(subscriptions)
          .set({ status: "cancelled", updatedAt: new Date() })
          .where(eq(subscriptions.lemonsqueezySubscriptionId, lsSubscriptionId));
        break;
      }

      case "subscription_expired": {
        if (!lsSubscriptionId) break;
        const [sub] = await db
          .select({ userId: subscriptions.userId })
          .from(subscriptions)
          .where(eq(subscriptions.lemonsqueezySubscriptionId, lsSubscriptionId))
          .limit(1);

        await db
          .update(subscriptions)
          .set({ status: "expired", updatedAt: new Date() })
          .where(eq(subscriptions.lemonsqueezySubscriptionId, lsSubscriptionId));

        if (sub?.userId) {
          await db
            .update(users)
            .set({ tier: "free", updatedAt: new Date() })
            .where(eq(users.id, sub.userId));
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
