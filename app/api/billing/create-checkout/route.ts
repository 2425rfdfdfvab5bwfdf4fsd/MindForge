import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/server/db";
import { users } from "@/shared/schema";
import { eq } from "drizzle-orm";
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

    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, session.id))
      .limit(1);

    const email = user?.email ?? session.email ?? "";
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
