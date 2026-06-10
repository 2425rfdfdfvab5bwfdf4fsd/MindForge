import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
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

  if (!eventName || !attrs) return NextResponse.json({ received: true });

  const userId = (customData?.user_id as string) ?? null;
  const lsSubscriptionId = dataObj?.id as string | undefined;
  const lsCustomerId = String(attrs.customer_id ?? "");
  const variantId = String(attrs.variant_id ?? "");

  const rawStatus = attrs.status as string | undefined;
  const statusMap: Record<string, string> = {
    active: "active",
    cancelled: "cancelled",
    past_due: "past_due",
    expired: "expired",
    unpaid: "past_due",
  };

  const currentPeriodEnd = attrs.renews_at
    ? new Date(attrs.renews_at as string).toISOString()
    : attrs.ends_at
    ? new Date(attrs.ends_at as string).toISOString()
    : null;

  try {
    switch (eventName) {
      case "subscription_created": {
        if (!userId || !lsSubscriptionId) break;
        const tier = mapVariantToTier(variantId) ?? "pro";

        const existing = await adminDb
          .collection("subscriptions")
          .where("lemonsqueezySubscriptionId", "==", lsSubscriptionId)
          .limit(1)
          .get();

        if (existing.empty) {
          await adminDb.collection("subscriptions").add({
            userId,
            lemonsqueezyCustomerId: lsCustomerId || null,
            lemonsqueezySubscriptionId: lsSubscriptionId,
            tier,
            status: "active",
            currentPeriodEnd,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        } else {
          await existing.docs[0].ref.update({
            status: "active",
            tier,
            currentPeriodEnd,
            updatedAt: new Date().toISOString(),
          });
        }

        await adminDb.collection("users").doc(userId).update({
          tier,
          updatedAt: new Date().toISOString(),
        });
        break;
      }

      case "subscription_updated": {
        if (!lsSubscriptionId) break;
        const status = statusMap[rawStatus ?? ""] ?? "active";
        const snap = await adminDb
          .collection("subscriptions")
          .where("lemonsqueezySubscriptionId", "==", lsSubscriptionId)
          .limit(1)
          .get();
        if (!snap.empty) {
          await snap.docs[0].ref.update({
            status,
            currentPeriodEnd,
            updatedAt: new Date().toISOString(),
          });
        }
        break;
      }

      case "subscription_cancelled": {
        if (!lsSubscriptionId) break;
        const snap = await adminDb
          .collection("subscriptions")
          .where("lemonsqueezySubscriptionId", "==", lsSubscriptionId)
          .limit(1)
          .get();
        if (!snap.empty) {
          await snap.docs[0].ref.update({
            status: "cancelled",
            updatedAt: new Date().toISOString(),
          });
        }
        break;
      }

      case "subscription_expired": {
        if (!lsSubscriptionId) break;
        const snap = await adminDb
          .collection("subscriptions")
          .where("lemonsqueezySubscriptionId", "==", lsSubscriptionId)
          .limit(1)
          .get();
        if (!snap.empty) {
          const sub = snap.docs[0].data();
          await snap.docs[0].ref.update({
            status: "expired",
            updatedAt: new Date().toISOString(),
          });
          if (sub.userId) {
            await adminDb.collection("users").doc(sub.userId).update({
              tier: "free",
              updatedAt: new Date().toISOString(),
            });
          }
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
