import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import { createCheckoutUrl, getVariantIdForPlan } from "@/lib/lemonsqueezy";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let planKey: string;
  try {
    const body = await request.json();
    planKey = body.planKey;
    if (!planKey) throw new Error("Missing planKey");
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const variantId = getVariantIdForPlan(planKey);

    const userDoc = await adminDb.collection("users").doc(session.id).get();
    const email = userDoc.data()?.email ?? session.email ?? "";
    const checkoutUrl = await createCheckoutUrl(session.id, email, variantId);

    return NextResponse.json({ checkoutUrl });
  } catch (err) {
    console.error("Checkout creation failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
